package com.example.demo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Controller;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.*;

@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice(annotations = Controller.class)
public class GlobalErrors extends ResponseEntityExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalErrors.class);

  /* ------------ Helpers ------------ */

  private boolean wantsJson(HttpServletRequest req) {
    String accept = req.getHeader("Accept");
    String xhr = req.getHeader("X-Requested-With");
    String path = req.getRequestURI() == null ? "" : req.getRequestURI();
    return (accept != null && accept.contains(MediaType.APPLICATION_JSON_VALUE))
        || "XMLHttpRequest".equalsIgnoreCase(xhr)
        || path.startsWith("/api/");
  }

  private ResponseEntity<Object> body(HttpStatus status, String code, String message, HttpServletRequest req) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("timestamp", OffsetDateTime.now().toString());
    body.put("status", status.value());
    body.put("error", code);
    body.put("message", message);
    body.put("path", req.getRequestURI());
    String trace = Optional.ofNullable(req.getHeader("X-Trace-Id"))
            .orElse(UUID.randomUUID().toString());
    body.put("traceId", trace);
    return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
  }

  private String redirect(String target, String code) {
    String url = target + (target.contains("?") ? "&" : "?")
        + "error=" + URLEncoder.encode(code, StandardCharsets.UTF_8);
    return "redirect:" + url;
  }

  /* ------------ Spring MVC (override defaults) ------------ */

  @Override
  protected ResponseEntity<Object> handleNoHandlerFoundException(
      NoHandlerFoundException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

    HttpServletRequest req = (HttpServletRequest) request.resolveReference("request");
    log.debug("404 NoHandlerFound: {} {}", ex.getHttpMethod(), ex.getRequestURL());
    return body(HttpStatus.NOT_FOUND, "not_found",
        "No handler for " + ex.getHttpMethod() + " " + ex.getRequestURL(), req);
  }

  @Override
  protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
      HttpRequestMethodNotSupportedException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

    HttpServletRequest req = (HttpServletRequest) request.resolveReference("request");
    String allowed = ex.getSupportedHttpMethods() == null ? "[]" : ex.getSupportedHttpMethods().toString();
    return body(HttpStatus.METHOD_NOT_ALLOWED, "method_not_allowed", "Use " + allowed, req);
  }

  @Override
  protected ResponseEntity<Object> handleMissingServletRequestParameter(
      MissingServletRequestParameterException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

    HttpServletRequest req = (HttpServletRequest) request.resolveReference("request");
    return body(HttpStatus.BAD_REQUEST, "missing_parameter",
        "Required parameter '" + ex.getParameterName() + "' is missing", req);
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

    HttpServletRequest req = (HttpServletRequest) request.resolveReference("request");
    List<Map<String, Object>> errors = ex.getBindingResult().getFieldErrors().stream().map(fe -> {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("field", fe.getField());
      m.put("rejected", fe.getRejectedValue());
      m.put("message", fe.getDefaultMessage());
      return m;
    }).toList();

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("timestamp", OffsetDateTime.now().toString());
    body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
    body.put("error", "validation_failed");
    body.put("message", "Request validation failed");
    body.put("path", req.getRequestURI());
    body.put("errors", errors);
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).contentType(MediaType.APPLICATION_JSON).body(body);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(
      HttpMediaTypeNotSupportedException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

    HttpServletRequest req = (HttpServletRequest) request.resolveReference("request");
    return body(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "media_type_not_supported",
        "Unsupported content type: " + ex.getContentType(), req);
  }

  /* ------------ Specific exception handlers ------------ */

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<Object> handleTypeMismatch(HttpServletRequest req, MethodArgumentTypeMismatchException ex) {
    return body(HttpStatus.BAD_REQUEST, "type_mismatch",
        "Parameter '" + ex.getName() + "' expects type " + ex.getRequiredType(), req);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Object> handleConstraintViolation(HttpServletRequest req, ConstraintViolationException ex) {
    return body(HttpStatus.BAD_REQUEST, "constraint_violation", ex.getMessage(), req);
  }

  // Authentication failures (not logged in / invalid session)
  @ExceptionHandler(AuthenticationException.class)
  public Object handleAuth(HttpServletRequest req, AuthenticationException ex) {
    log.debug("401 Authentication error: {}", ex.getMessage());
    if (wantsJson(req)) {
      return body(HttpStatus.UNAUTHORIZED, "unauthorized", "Login required", req);
    }
    return redirect("/login", "auth_required");
  }

  // Access denied (logged in, but insufficient privileges)
  @ExceptionHandler(AccessDeniedException.class)
  public Object handleAccessDenied(HttpServletRequest req, AccessDeniedException ex) {
    log.debug("403 Access denied: {}", ex.getMessage());
    if (wantsJson(req)) {
      return body(HttpStatus.FORBIDDEN, "forbidden", "Insufficient privileges", req);
    }
    return redirect("/login", "forbidden");
  }

  // OAuth2/OIDC provider errors
  @ExceptionHandler(OAuth2AuthenticationException.class)
  public Object handleOAuth2(HttpServletRequest req, OAuth2AuthenticationException ex) {
    log.warn("OAuth2 error: {} - {}", ex.getError().getErrorCode(), ex.getMessage());
    if (wantsJson(req)) {
      return body(HttpStatus.UNAUTHORIZED, "oauth2_auth", ex.getError().toString(), req);
    }
    return redirect("/login", "oauth2_auth");
  }


  // Last resort: any RuntimeException
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Object> handleRuntime(HttpServletRequest req, RuntimeException ex) {
    log.error("500 Runtime exception at {}: ", req.getRequestURI(), ex);
    return body(HttpStatus.INTERNAL_SERVER_ERROR, "runtime_error", "Unexpected error", req);
  }

  // Absolutely everything else
  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> handleAny(HttpServletRequest req, Exception ex) {
    log.error("500 Exception at {}: ", req.getRequestURI(), ex);
    return body(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "Something went wrong", req);
  }
}
