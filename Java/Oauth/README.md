
# Dual Context

# Conversion: Single Context → Dual Context Architecture

## Step 0: Original Application (Single Context)

This is a typical Spring Boot application with everything in one context.

### Before: Single SpringApplication

```java
@SpringBootApplication
@ComponentScan(basePackages = "com.example")
public class SingleContextApplication {

    public static void main(String[] args) {
        SpringApplication.run(SingleContextApplication.class, args);
    }
}
```

### Before: Single Application Configuration

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Everything in one context
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/css/");
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/js/");
    }
}
```

### Before: Controllers (Everything Mixed)

```java
// All in the same context - static and API mixed
@Controller
@RequestMapping("/static")
public class StaticController {
    @GetMapping("/index")
    public String getIndex() { return "index"; }
}

@RestController
@RequestMapping("/api")
public class ApiController {
    @Autowired
    private UserService userService;
    
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
```

### Before: Project Structure (Single Context)

```
src/main/resources/
├── application.properties
├── static/
│   ├── index.html
│   ├── css/
│   └── js/
└── templates/

src/main/java/com/example/
├── SingleContextApplication.java
├── config/
│   └── WebConfig.java
├── controller/
│   ├── StaticController.java
│   └── ApiController.java
└── service/
    └── UserService.java
```

---

## Step 1: Add Dual Context Dependencies

### Before pom.xml (Single Context)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
    </dependency>
</dependencies>
```

### After pom.xml (Dual Context)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Framework Core -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
    </dependency>
    
    <!-- For XML configuration (dual contexts) -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-beans</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
</dependencies>
```

---

## Step 2: Refactor Main Application Class

### Before: Single Context Application

```java
@SpringBootApplication
@ComponentScan(basePackages = "com.example")
public class SingleContextApplication {

    public static void main(String[] args) {
        SpringApplication.run(SingleContextApplication.class, args);
    }
}
```

### After: Dual Context Application

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

/**
 * CONVERSION: From single context to dual context
 * 
 * Changes:
 * 1. Keep @SpringBootApplication but it now serves as parent context only
 * 2. Add two DispatcherServlet beans with separate ApplicationContexts
 * 3. Each context has its own XML configuration file
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.example.config")  // Only config in parent
public class DualContextApplication {

    public static void main(String[] args) {
        SpringApplication.run(DualContextApplication.class, args);
    }

    /**
     * Step 1: Create Static Content Context
     * Maps to: /static/*
     */
    @Bean
    public ServletRegistrationBean<DispatcherServlet> staticDispatcherServlet(
            ApplicationContext parentContext) {
        
        // Create child context from XML configuration
        ClassPathXmlApplicationContext staticContext = 
            new ClassPathXmlApplicationContext(
                new String[]{"classpath:contexts/static-context.xml"}, 
                parentContext  // Pass parent context as reference
            );
        
        DispatcherServlet dispatcher = new DispatcherServlet(staticContext);
        
        ServletRegistrationBean<DispatcherServlet> registration = 
            new ServletRegistrationBean<>(dispatcher, "/static/*");
        registration.setName("staticDispatcher");
        registration.setLoadOnStartup(1);  // Load first
        
        return registration;
    }

    /**
     * Step 2: Create API Context
     * Maps to: /api/*
     */
    @Bean
    public ServletRegistrationBean<DispatcherServlet> apiDispatcherServlet(
            ApplicationContext parentContext) {
        
        // Create child context from XML configuration
        ClassPathXmlApplicationContext apiContext = 
            new ClassPathXmlApplicationContext(
                new String[]{"classpath:contexts/api-context.xml"}, 
                parentContext  // Pass parent context as reference
            );
        
        DispatcherServlet dispatcher = new DispatcherServlet(apiContext);
        
        ServletRegistrationBean<DispatcherServlet> registration = 
            new ServletRegistrationBean<>(dispatcher, "/api/*");
        registration.setName("apiDispatcher");
        registration.setLoadOnStartup(2);  // Load second
        
        return registration;
    }
}
```

**Key Differences:**
- ✅ Keep `@SpringBootApplication` for Spring Boot's auto-configuration
- ✅ Add `@ComponentScan` to only scan the root/parent packages
- ✅ Create two `ServletRegistrationBean` beans for each dispatcher
- ✅ Each dispatcher gets its own child `ApplicationContext` from XML
- ✅ Pass parent context to child contexts for bean sharing

---

## Step 3: Create Root Context Configuration

### New File: src/main/resources/contexts/root-context.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xmlns:context="http://www.springframework.org/schema/context"
   xsi:schemaLocation="http://www.springframework.org/schema/beans
   http://www.springframework.org/schema/beans/spring-beans.xsd
   http://www.springframework.org/schema/context
   http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- Root/Parent Context - Shared beans for all child contexts -->
    
    <!-- Component scan for services and repositories (NOT controllers) -->
    <context:component-scan base-package="com.example.service"/>
    <context:component-scan base-package="com.example.repository"/>

    <!-- Property placeholder for externalized configuration -->
    <context:property-placeholder location="classpath:application.properties"/>

    <!-- DataSource bean (shared) -->
    <bean id="dataSource" 
          class="org.springframework.jdbc.datasource.DriverManagerDataSource">
        <property name="driverClassName" value="org.h2.Driver"/>
        <property name="url" value="jdbc:h2:mem:testdb"/>
        <property name="username" value="sa"/>
        <property name="password" value=""/>
    </bean>

    <!-- Transaction manager (shared) -->
    <bean id="transactionManager" 
          class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource"/>
    </bean>

</beans>
```

**What Goes Here:**
- ✅ Service layer beans
- ✅ Repository beans
- ✅ Database configuration (DataSource)
- ✅ Transaction managers
- ✅ Shared utilities

**What Does NOT Go Here:**
- ❌ Controllers
- ❌ View resolvers
- ❌ Static resource handlers
- ❌ Web-specific configurations

---

## Step 4: Create Static Context Configuration

### New File: src/main/resources/contexts/static-context.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xmlns:mvc="http://www.springframework.org/schema/mvc"
   xmlns:context="http://www.springframework.org/schema/context"
   xsi:schemaLocation="http://www.springframework.org/schema/beans
   http://www.springframework.org/schema/beans/spring-beans.xsd
   http://www.springframework.org/schema/mvc
   http://www.springframework.org/schema/mvc/spring-mvc.xsd
   http://www.springframework.org/schema/context
   http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- Static Content Context - Serves /static/* -->
    
    <!-- Enable MVC support -->
    <mvc:annotation-driven/>

    <!-- Component scan ONLY for static controllers -->
    <context:component-scan base-package="com.example.controller.static"/>

    <!-- Static resource mappings -->
    <mvc:resources mapping="/static/**" location="classpath:/static/"/>
    <mvc:resources mapping="/css/**" location="classpath:/css/"/>
    <mvc:resources mapping="/js/**" location="classpath:/js/"/>
    <mvc:resources mapping="/images/**" location="classpath:/images/"/>
    <mvc:resources mapping="/fonts/**" location="classpath:/fonts/"/>

    <!-- View resolver for HTML templates -->
    <bean id="viewResolver" 
          class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/static/"/>
        <property name="suffix" value=".html"/>
    </bean>

</beans>
```

**What Goes Here:**
- ✅ Static resource handlers
- ✅ Static content controllers
- ✅ View resolvers for static pages
- ✅ MVC configuration for static serving

**What Does NOT Go Here:**
- ❌ API controllers
- ❌ REST services
- ❌ JSON configuration

---

## Step 5: Create API Context Configuration

### New File: src/main/resources/contexts/api-context.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xmlns:mvc="http://www.springframework.org/schema/mvc"
   xmlns:context="http://www.springframework.org/schema/context"
   xsi:schemaLocation="http://www.springframework.org/schema/beans
   http://www.springframework.org/schema/beans/spring-beans.xsd
   http://www.springframework.org/schema/mvc
   http://www.springframework.org/schema/mvc/spring-mvc.xsd
   http://www.springframework.org/schema/context
   http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- API Context - Serves /api/* -->
    
    <!-- Enable MVC support for REST APIs -->
    <mvc:annotation-driven>
        <mvc:message-converters>
            <!-- Jackson for JSON serialization -->
            <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"/>
        </mvc:message-converters>
    </mvc:annotation-driven>

    <!-- Component scan ONLY for API controllers -->
    <context:component-scan base-package="com.example.controller.api"/>

    <!-- Optional: Global exception handler for API -->
    <bean id="globalExceptionHandler" 
          class="com.example.api.config.GlobalExceptionHandler"/>

</beans>
```

**What Goes Here:**
- ✅ REST controllers
- ✅ JSON message converters
- ✅ API-specific configuration
- ✅ Exception handlers for API

**What Does NOT Go Here:**
- ❌ Static resource handlers
- ❌ View resolvers
- ❌ Static controllers

---

## Step 6: Reorganize Controllers

### Before: Controllers Mixed Together

```
src/main/java/com/example/
└── controller/
    ├── StaticController.java      (static content)
    ├── ApiController.java          (API)
    └── DashboardController.java    (static content)
```

### After: Controllers Separated by Context

```
src/main/java/com/example/
├── controller/
│   ├── static/
│   │   ├── StaticController.java
│   │   ├── DashboardController.java
│   │   └── PageController.java
│   └── api/
│       ├── UserController.java
│       ├── ProductController.java
│       └── OrderController.java
├── service/
│   ├── UserService.java
│   ├── ProductService.java
│   └── OrderService.java
└── config/
    └── root-context configuration (Java or XML)
```

### Before: Static Controller (Mixed)

```java
@Controller
@RequestMapping("/static")
public class StaticController {
    
    // Services from same context
    @Autowired
    private UserService userService;  // Mixed with static content
    
    @GetMapping("/index")
    public String getIndex(Model model) {
        return "index";
    }
}
```

### After: Static Controller (Separated)

```java
package com.example.controller.static;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * Static Content Controller
 * Runs in STATIC context only
 * Handles /static/* requests
 */
@Controller
@RequestMapping("/static")
public class StaticController {
    
    @GetMapping("/index")
    public ModelAndView getIndex() {
        return new ModelAndView("index");
    }

    @GetMapping("/dashboard")
    public ModelAndView getDashboard() {
        return new ModelAndView("dashboard");
    }
}
```

### Before: API Controller (Mixed)

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
```

### After: API Controller (Separated)

```java
package com.example.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.service.UserService;

/**
 * API Controller
 * Runs in API context only
 * Handles /api/* requests
 */
@RestController
@RequestMapping("/api")
public class UserController {
    
    @Autowired
    private UserService userService;  // From parent context
    
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }
}
```

---

## Step 7: Update Project Structure

### Before: Single Context Structure

```
src/
├── main/
│   ├── java/com/example/
│   │   ├── SingleContextApplication.java
│   │   ├── config/
│   │   │   └── WebConfig.java
│   │   ├── controller/
│   │   │   ├── StaticController.java
│   │   │   └── ApiController.java
│   │   └── service/
│   │       └── UserService.java
│   └── resources/
│       ├── application.properties
│       └── static/
│           ├── index.html
│           ├── css/
│           └── js/
```

### After: Dual Context Structure

```
src/
├── main/
│   ├── java/com/example/
│   │   ├── DualContextApplication.java          (Main - parent context)
│   │   ├── config/
│   │   │   └── RootConfig.java                  (Parent context config)
│   │   ├── controller/
│   │   │   ├── static/
│   │   │   │   ├── StaticController.java        (Static context)
│   │   │   │   └── PageController.java
│   │   │   └── api/
│   │   │       ├── UserController.java          (API context)
│   │   │       └── ProductController.java
│   │   ├── service/
│   │   │   ├── UserService.java                 (Parent context)
│   │   │   └── ProductService.java
│   │   └── repository/
│   │       ├── UserRepository.java              (Parent context)
│   │       └── ProductRepository.java
│   └── resources/
│       ├── application.properties
│       ├── contexts/                            (NEW: Context configs)
│       │   ├── root-context.xml                 (Parent)
│       │   ├── static-context.xml               (Static child)
│       │   └── api-context.xml                  (API child)
│       └── static/
│           ├── index.html
│           ├── css/
│           └── js/
```

---

## Step 8: Update application.properties

### Before: Single Context

```properties
# Application
spring.application.name=single-context-app
server.port=8080

# Logging
logging.level.root=INFO
logging.level.com.example=DEBUG
```

### After: Dual Context (Same, but can add context-specific props)

```properties
# Application
spring.application.name=dual-context-app
server.port=8080

# Parent Context Configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver

# Logging
logging.level.root=INFO
logging.level.com.example=DEBUG

# Static Context (optional)
spring.mvc.static-path-pattern=/static/**
spring.web.resources.cache.period=3600

# API Context (optional)
server.servlet.context-path=/app
```

---

## Step 9: Migration Checklist

- [ ] Update main application class to extend contexts
- [ ] Add `ServletRegistrationBean` beans for static and API dispatchers
- [ ] Create `root-context.xml` with shared beans
- [ ] Create `static-context.xml` with static handlers
- [ ] Create `api-context.xml` with API configuration
- [ ] Move static controllers to `controller/static/` package
- [ ] Move API controllers to `controller/api/` package
- [ ] Remove `@ComponentScan` from main class (or limit it)
- [ ] Update `component-scan` in XML files with correct packages
- [ ] Test static requests: `/static/index.html`
- [ ] Test API requests: `/api/users`
- [ ] Verify parent context beans are accessible from child contexts
- [ ] Check logging to ensure all contexts initialize correctly

---

## Step 10: Testing the Conversion

### Test 1: Verify Context Initialization

```java
@SpringBootTest
public class DualContextApplicationTest {
    
    @Autowired
    private ApplicationContext parentContext;
    
    @Test
    public void testContextsInitialize() {
        assertNotNull(parentContext);
        
        // Parent context should have services
        assertNotNull(parentContext.getBean("userService"));
        
        // Parent context should NOT have controllers
        assertThrows(NoSuchBeanDefinitionException.class, 
            () -> parentContext.getBean("userController"));
    }
}
```

### Test 2: Static Context Requests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class StaticContextTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    public void testStaticResourceRequest() {
        ResponseEntity<String> response = 
            restTemplate.getForEntity("/static/index.html", String.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

### Test 3: API Context Requests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApiContextTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    public void testApiRequest() {
        ResponseEntity<String> response = 
            restTemplate.getForEntity("/api/users", String.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

---

## Summary of Changes

| Aspect | Before (Single) | After (Dual) |
|--------|-----------------|--------------|
| **Contexts** | 1 context | 3 contexts (1 parent + 2 children) |
| **Dispatchers** | 1 default DispatcherServlet | 2 custom DispatcherServlets |
| **Configuration** | Single Java config or XML | 3 XML files + main app |
| **Controllers** | All mixed in one package | Separated: `static/` and `api/` |
| **Services** | Local to context | Shared in parent context |
| **Database** | In web context | In parent context |
| **Static Resources** | MVC resource handler | Dedicated static context |
| **URLs** | All under root | `/static/*` and `/api/*` |
| **Scalability** | Limited | Independent scaling per context |

---

## Common Issues During Conversion

### Issue 1: Bean Not Found in Child Context

**Problem:** Child context can't find parent bean

**Solution:** Ensure bean is defined in parent context AND pass parent as reference:

```java
new ClassPathXmlApplicationContext(
    new String[]{"classpath:api-context.xml"}, 
    parentContext  // ← Pass parent
);
```

### Issue 2: Controllers Not Being Loaded

**Problem:** Controllers not registered in dispatcher

**Solution:** Verify `component-scan` in XML file:

```xml
<context:component-scan base-package="com.example.controller.api"/>
```

### Issue 3: 404 on Static Resources

**Problem:** Static files not found

**Solution:** Check XML resource mapping:

```xml
<mvc:resources mapping="/static/**" location="classpath:/static/"/>
```

### Issue 4: Circular Dependency

**Problem:** Child context depends on something not in parent

**Solution:** Move required bean to parent context

---

## Performance Comparison

| Metric | Single Context | Dual Context |
|--------|----------------|--------------|
| **Startup Time** | ~2-3 seconds | ~2.5-3.5 seconds |
| **Memory Usage** | ~150MB | ~180-200MB |
| **Request Latency** | 5-10ms | 5-15ms (context switching) |
| **Static File Serving** | Mixed pipeline | Dedicated pipeline |
| **Thread Pools** | Shared | Dedicated per context |

Dual context has slight overhead but better separation and scalability.

# Dual Spring Context Setup Guide

## Overview

This guide explains how to set up multiple Spring ApplicationContexts in a single application, with one context serving static content and another handling API requests.

## Architecture

```
Application
├── Root Context (Parent)
│   ├── DataSource
│   ├── UserService
│   ├── ProductService
│   └── TransactionManager
│
├── Static Context (Child)
│   ├── DispatcherServlet registered at /static/*
│   ├── Static Resource Handlers
│   └── StaticContentController
│
└── API Context (Child)
    ├── DispatcherServlet registered at /api/*
    ├── REST Controllers
    └── API Services
```

## Key Components

### 1. Main Application Class

The main application class sets up two DispatcherServlets, each with its own ApplicationContext:

```java
@SpringBootApplication
public class DualContextApplication {
    
    @Bean
    public ServletRegistrationBean<DispatcherServlet> staticDispatcherServlet(
            ApplicationContext parentContext) {
        // Create child context for static content
        ClassPathXmlApplicationContext staticContext = 
            new ClassPathXmlApplicationContext(
                new String[]{"classpath:static-context.xml"}, 
                parentContext
            );
        
        DispatcherServlet dispatcher = new DispatcherServlet(staticContext);
        ServletRegistrationBean<DispatcherServlet> registration = 
            new ServletRegistrationBean<>(dispatcher, "/static/*");
        registration.setName("staticDispatcher");
        registration.setLoadOnStartup(1);
        
        return registration;
    }
    
    @Bean
    public ServletRegistrationBean<DispatcherServlet> apiDispatcherServlet(
            ApplicationContext parentContext) {
        // Create child context for API
        ClassPathXmlApplicationContext apiContext = 
            new ClassPathXmlApplicationContext(
                new String[]{"classpath:api-context.xml"}, 
                parentContext
            );
        
        DispatcherServlet dispatcher = new DispatcherServlet(apiContext);
        ServletRegistrationBean<DispatcherServlet> registration = 
            new ServletRegistrationBean<>(dispatcher, "/api/*");
        registration.setName("apiDispatcher");
        registration.setLoadOnStartup(2);
        
        return registration;
    }
}
```

### 2. Root Context (root-context.xml)

The root context contains shared beans available to all child contexts:

- DataSource configuration
- Service layer beans (UserService, ProductService)
- Transaction managers
- Database configuration

**Key Point:** Child contexts can access beans from the parent context but not vice versa.

### 3. Static Context (static-context.xml)

Handles static resources and file serving:

```xml
<mvc:resources mapping="/static/**" location="classpath:/static/"/>
<mvc:resources mapping="/images/**" location="classpath:/images/"/>
<mvc:resources mapping="/css/**" location="classpath:/css/"/>
<mvc:resources mapping="/js/**" location="classpath:/js/"/>
```

Benefits:
- Isolated from API context
- Optimized for static resource serving
- No unnecessary business logic overhead

### 4. API Context (api-context.xml)

Handles REST API endpoints:

- REST controllers
- Component scanning for API packages
- References to shared services from parent context
- Jackson for JSON serialization

Benefits:
- Separated from static content handling
- Can be scaled independently
- Focused on API functionality

## URL Routing

| Request Path | Handler | Context |
|--------------|---------|---------|
| `/static/index.html` | StaticContentController | Static Context |
| `/static/css/style.css` | Resource Handler | Static Context |
| `/static/js/app.js` | Resource Handler | Static Context |
| `/api/users` | ApiController | API Context |
| `/api/products/{id}` | ApiController | API Context |
| `/api/health` | ApiController | API Context |

## Request Flow

### Static Content Request
```
GET /static/index.html
    ↓
Static DispatcherServlet (mapped to /static/*)
    ↓
Static Context ApplicationContext
    ↓
StaticContentController or Resource Handler
    ↓
Return static file
```

### API Request
```
GET /api/users
    ↓
API DispatcherServlet (mapped to /api/*)
    ↓
API Context ApplicationContext
    ↓
API DispatcherServlet routes to ApiController
    ↓
ApiController calls UserService (from parent context)
    ↓
Return JSON response
```

## Configuration

### application.properties

```properties
# Application name
spring.application.name=dual-context-app

# Server port
server.port=8080

# Logging levels
logging.level.root=INFO
logging.level.com.example=DEBUG

# Enable component scanning
spring.mvc.view.prefix=/WEB-INF/views/
spring.mvc.view.suffix=.jsp
```

### application.yml (Alternative)

```yaml
spring:
  application:
    name: dual-context-app
  mvc:
    view:
      prefix: /WEB-INF/views/
      suffix: .jsp

server:
  port: 8080

logging:
  level:
    root: INFO
    com.example: DEBUG
```

## Bean Access

### Child Context accessing Parent Context Beans

In the API context, you can autowire beans from the parent context:

```java
@RestController
public class ApiController {
    
    @Autowired
    private UserService userService;  // From parent context
    
    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
```

### Parent Context Beans NOT accessible to Child Context

Beans defined in child contexts are **not** visible to the parent context or sibling contexts:

```java
// This will NOT work - apiBean is not visible outside API context
@Autowired
private SomeApiBeanFromApiContext apiBean;  // ❌ NoSuchBeanDefinitionException
```

## Advantages of Dual Context Architecture

1. **Separation of Concerns:** Static and API handling are logically separated
2. **Independent Scaling:** Each context can be optimized separately
3. **Resource Isolation:** Different thread pools and configurations per context
4. **Security:** Can apply different security rules to static vs. API
5. **Performance:** Static resources handled efficiently without API overhead
6. **Maintainability:** Clear structure and easier to understand
7. **Testing:** Can test contexts independently

## Disadvantages & Considerations

1. **Complexity:** More setup and configuration required
2. **Memory Overhead:** Multiple contexts consume more memory
3. **Context Switching:** Request routing overhead between contexts
4. **Debugging:** More complex debugging with multiple contexts
5. **Bean Visibility:** Need to understand parent-child bean relationships

## Alternative Approaches

### Option 1: Single Context with Request Mapping
```java
@RestController
@RequestMapping("/api")
public class ApiController { }
```

### Option 2: Servlet Filters
```java
@Component
public class StaticResourceFilter extends OncePerRequestFilter { }
```

### Option 3: Separate Applications
- Run two independent Spring applications
- Use a reverse proxy (Nginx, Apache) for routing

## Best Practices

1. **Use parent context for shared beans** - database, services, configuration
2. **Keep child contexts focused** - one for static, one for API
3. **Don't duplicate beans** - reference parent context beans instead
4. **Use meaningful servlet names** - staticDispatcher, apiDispatcher
5. **Set correct load order** - StaticDispatcher first (loadOnStartup=1)
6. **Document bean visibility** - which beans are accessible where
7. **Monitor memory usage** - multiple contexts consume more resources
8. **Use Spring profiles** - different configs for dev, test, prod

## Troubleshooting

### Bean Not Found Exception
- **Cause:** Trying to access a bean from wrong context
- **Solution:** Define bean in parent context if needed by both children

### DispatcherServlet Not Routing Correctly
- **Cause:** Wrong URL patterns in registration
- **Solution:** Verify path patterns match your request URLs

### Context Initialization Failure
- **Cause:** Missing dependency in XML configuration
- **Solution:** Check XML files for correct bean definitions and imports

### Performance Issues
- **Cause:** Too many contexts or inefficient resource allocation
- **Solution:** Profile and optimize, consider consolidating contexts

## Conclusion

Dual context architecture is powerful for separating static content serving from API handling. It provides better organization, performance optimization, and scalability compared to handling both in a single context. However, it adds complexity, so evaluate if your application truly needs this separation.


# OAUTH Java
# OAuth2 Explained Simply
## How Authentication, Roles, and Access Control Work

---

## The Nightclub Analogy

Imagine OAuth2 is like getting into a nightclub with different VIP levels:

### Without OAuth2 (The Old Way)
You give the nightclub your driver's license, and they keep it all night. If you want to go to multiple clubs, you need to give each one your license. **Problem**: You're trusting everyone with your most important ID!

### With OAuth2 (The Modern Way)
1. You show your driver's license to a **trusted bouncer** (Keycloak/Identity Provider)
2. The bouncer checks your ID and gives you a **wristband** (Access Token)
3. The wristband has **different colors** for different access levels (Roles):
   - 🟢 Green = Regular customer (USER role)
   - 🔵 Blue = VIP member (ADMIN role)
   - 🟡 Yellow = Premium VIP (MANAGER role)
4. You show the **wristband** to enter different areas of the club
5. Each area checks your wristband color before letting you in
6. Your driver's license stays safe with you!

**Key Point**: You never give your actual password (driver's license) to the application (nightclub). You only give it to the trusted identity provider (bouncer), who gives you a temporary access token (wristband).

---

## The 5 Main Characters in OAuth2

### 1. **You** (Resource Owner)
The actual user trying to access something.

### 2. **The App** (Client Application)
The application you want to use (your Spring Boot app, a mobile app, etc.)

### 3. **The Bouncer** (Authorization Server)
The trusted identity provider that verifies who you are. Examples:
- Keycloak
- Auth0
- Google Login
- Facebook Login
- Okta

### 4. **Your Personal Info** (Resource Server)
The protected data or services you're trying to access (could be the same as the Client Application or separate).

### 5. **The Wristband** (Access Token)
A temporary pass that proves you're authenticated and shows what you're allowed to do.

---

## The OAuth2 Dance: Step by Step

Let's say you want to use a web application that uses Keycloak for login:

### Step 1: You Try to Enter (Initial Request)
```
You: "Hey App, I want to see my dashboard!"
App: "I need to verify who you are first. Let me send you to Keycloak."
```

**What happens**: You click "Login" and the app redirects you to Keycloak.

---

### Step 2: Login at the Bouncer (Authentication)
```
You arrive at Keycloak's login page
Keycloak: "Show me your credentials!"
You: "Here's my username and password"
Keycloak: *checks database* "Verified! You're really you!"
```

**What happens**: You enter your username and password directly into Keycloak (NOT the app!). Keycloak verifies your credentials.

---

### Step 3: The Bouncer Gives Permission Slip (Authorization Code)
```
Keycloak: "You're legit! Here's a special code. Take this back to the App."
*Keycloak redirects you back to the App with a secret code*
```

**What happens**: Keycloak generates a temporary authorization code and redirects you back to the application with this code in the URL.

**Example URL**: `http://localhost:8080/login/oauth2/code/keycloak?code=abc123xyz`

---

### Step 4: The App Exchanges Code for Wristband (Token Exchange)
```
App: "Hey Keycloak, this user gave me code 'abc123xyz'"
App: *whispers client secret* "Here's proof that I'm the real app"
Keycloak: "Code is valid! Here's an Access Token and ID Token"
```

**What happens**: Behind the scenes (you don't see this), the app sends the authorization code + its client secret to Keycloak. Keycloak verifies everything and responds with tokens.

**What you get back**:
- **Access Token**: Your wristband (used to access protected resources)
- **ID Token**: Your profile information (who you are, your email, etc.)
- **Refresh Token**: A ticket to get a new wristband when the current one expires

---

### Step 5: Reading Your Wristband (Token Contains Your Info)
```json
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "preferred_username": "john.doe",
  "email": "john@example.com",
  "realm_access": {
    "roles": ["user", "admin"]
  },
  "resource_access": {
    "democlient": {
      "roles": ["manager"]
    }
  }
}
```

**What this means**:
- **sub**: Your unique ID (like a serial number)
- **preferred_username**: Your username (john.doe)
- **email**: Your email address
- **realm_access.roles**: Your global roles (work everywhere)
- **resource_access.democlient.roles**: Your app-specific roles (only for this app)

---

### Step 6: Using Your Wristband (Making Requests)
```
You: "Show me the admin panel"
App: *checks your wristband* "You have the ADMIN role! Here you go!"

You: "Show me the super-secret manager area"
App: *checks your wristband* "You have the MANAGER role! Access granted!"
```

**What happens**: Every time you try to access something, the app checks:
1. Is the token still valid? (not expired)
2. Does this user have the right role?
3. If yes → Allow access
4. If no → Show "403 Forbidden"

---

## How Roles Work: Two Types

### 1. Realm Roles (Global Access)
Think of these as **hotel key cards that work in multiple locations** of the hotel chain.

**Example in Keycloak**:
```json
"realm_access": {
  "roles": ["user", "admin", "vip"]
}
```

- **user**: Basic access (can view own profile)
- **admin**: Can manage other users
- **vip**: Premium features access

**Use case**: Roles that should work across ALL applications in your company.

---

### 2. Client Roles (App-Specific Access)
Think of these as **special access cards that only work in one specific building**.

**Example in Keycloak**:
```json
"resource_access": {
  "democlient": {
    "roles": ["manager", "viewer", "editor"]
  },
  "reporting-app": {
    "roles": ["analyst"]
  }
}
```

- **democlient.manager**: Can manage resources in democlient app only
- **reporting-app.analyst**: Can view reports in reporting-app only

**Use case**: Roles specific to one application that shouldn't apply elsewhere.

---

## The Token Lifecycle

### Token Lifespan
```
Access Token:  ████████░░░░░░░░░░ (15 minutes - expires quickly!)
Refresh Token: ████████████████░░ (30 days - lasts longer)
```

### What Happens When Token Expires?

**Scenario 1: Access Token Expires (After 15 minutes)**
```
You: "Show me my dashboard"
App: *checks token* "Your wristband expired!"
App: *uses refresh token* "Let me get you a new one from Keycloak"
Keycloak: "Refresh token is valid! Here's a new access token"
App: "Here's your dashboard!"
```

**You don't notice anything** - happens automatically in the background!

---

**Scenario 2: Refresh Token Expires (After 30 days)**
```
You: "Show me my dashboard"
App: *checks tokens* "Both tokens expired!"
App: "Please login again"
*Redirects you to Keycloak login page*
```

**You have to login again** - for security!

---

## How Your Spring App Uses OAuth2

Let's trace a real request through your code:

### Request: GET /api/admin/secret

#### Step 1: Spring Security Checks Authentication
```java
.anyRequest().authenticated()
```
**Question**: Is this user logged in (has a valid token)?
- ✓ Yes → Continue to Step 2
- ✗ No → Redirect to Keycloak login

---

#### Step 2: Spring Security Checks Authorization
```java
@PreAuthorize("hasRole('ADMIN')")
```
**Question**: Does this user have the ADMIN role?

Spring Security looks at the user's authorities:
```java
[
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_MANAGER"
]
```

**Result**: 
- ✓ Has ROLE_ADMIN → Allow access (200 OK)
- ✗ No ROLE_ADMIN → Deny access (403 Forbidden)

---

## The Role Extraction Magic

### From Keycloak Token to Spring Security Authorities

Here's how your code transforms Keycloak roles:

**Step 1: Keycloak sends token with roles**
```json
{
  "realm_access": {
    "roles": ["admin", "user"]
  },
  "resource_access": {
    "democlient": {
      "roles": ["manager"]
    }
  }
}
```

**Step 2: Your code extracts roles**
```java
// Collect from realm_access
roles.add("admin");
roles.add("user");

// Collect from resource_access.democlient
roles.add("manager");

// Now roles = ["admin", "user", "manager"]
```

**Step 3: Transform to Spring Security format**
```java
roles.stream()
  .map(s -> "ROLE_" + s.toUpperCase())
  .map(SimpleGrantedAuthority::new)
```

**Result**:
```java
[
  "ROLE_ADMIN",
  "ROLE_USER",
  "ROLE_MANAGER"
]
```

**Step 4: Spring Security uses these for access control**
```java
hasRole("ADMIN")      // checks for "ROLE_ADMIN" ✓
hasRole("USER")       // checks for "ROLE_USER" ✓
hasRole("SUPERUSER")  // checks for "ROLE_SUPERUSER" ✗
```

---

## Security: Why OAuth2 is Better

### The Old Way (Basic Auth)
```
Browser → App: "Here's username and password"
App stores: username + password in session
Every request: App checks username/password
```

**Problems**:
- ❌ App has access to your password
- ❌ Password sent with every request
- ❌ Can't revoke access without changing password
- ❌ Same password for all apps

---

### The OAuth2 Way
```
Browser → Keycloak: "Here's username and password" (only once!)
Keycloak → App: "Here's a token" (no password!)
Every request: App checks token (not password)
```

**Benefits**:
- ✅ App never sees your password
- ✅ Token expires automatically
- ✅ Can revoke token without changing password
- ✅ Different tokens for different apps
- ✅ Token includes role information

---

## Common Flows Explained

### Flow 1: Login
```
┌──────┐         ┌──────┐         ┌──────────┐
│ User │         │ App  │         │ Keycloak │
└──┬───┘         └──┬───┘         └────┬─────┘
   │                │                  │
   │  Click Login   │                  │
   │ ─────────────> │                  │
   │                │                  │
   │                │  Redirect to     │
   │                │  Keycloak        │
   │                │ ───────────────> │
   │                │                  │
   │  Show Login Page                  │
   │ <──────────────────────────────── │
   │                │                  │
   │  Enter Username & Password        │
   │ ───────────────────────────────> │
   │                │                  │
   │                │  Auth Code       │
   │                │ <─────────────── │
   │                │                  │
   │  Redirect with code               │
   │ <──────────────┤                  │
   │                │                  │
   │  Follow redirect                  │
   │ ─────────────> │                  │
   │                │                  │
   │                │  Exchange code   │
   │                │  for tokens      │
   │                │ ───────────────> │
   │                │                  │
   │                │  Return tokens   │
   │                │ <─────────────── │
   │                │                  │
   │  Show Dashboard│                  │
   │ <──────────────┤                  │
```

---

### Flow 2: Accessing Protected Resource
```
┌──────┐         ┌──────┐
│ User │         │ App  │
└──┬───┘         └──┬───┘
   │                │
   │  GET /admin   │
   │ ─────────────> │
   │                │
   │                │ Check token
   │                │ Check roles
   │                │ Has ROLE_ADMIN? ✓
   │                │
   │  Admin Data    │
   │ <──────────────┤
```

---

### Flow 3: Token Expired
```
┌──────┐         ┌──────┐         ┌──────────┐
│ User │         │ App  │         │ Keycloak │
└──┬───┘         └──┬───┘         └────┬─────┘
   │                │                  │
   │  GET /api/me  │                  │
   │ ─────────────> │                  │
   │                │                  │
   │                │ Token expired!   │
   │                │                  │
   │                │  Use refresh     │
   │                │  token           │
   │                │ ───────────────> │
   │                │                  │
   │                │  New access      │
   │                │  token           │
   │                │ <─────────────── │
   │                │                  │
   │  Return data   │                  │
   │ <──────────────┤                  │
```

---

## Real-World Example: Online Shopping

Let's see OAuth2 in action with a shopping website:

### Scenario: You want to view your orders

**1. You click "My Orders"**
```
You don't have a token yet, so the app redirects you to login
```

**2. You login with Keycloak**
```
Username: john.doe
Password: ********
```

**3. Keycloak checks your account and sees:**
```json
{
  "username": "john.doe",
  "roles": ["customer", "premium-member"]
}
```

**4. You get redirected back with tokens**
```
Access Token contains:
- Your ID
- Email: john.doe@example.com
- Roles: ["ROLE_CUSTOMER", "ROLE_PREMIUM_MEMBER"]
- Expires: in 15 minutes
```

**5. You can now access different features:**

```
✓ View Products         (anyone can do this)
✓ View My Orders        (needs ROLE_CUSTOMER)
✓ Premium Deals         (needs ROLE_PREMIUM_MEMBER)
✗ Admin Panel           (needs ROLE_ADMIN - you don't have this!)
```

**6. You try to access Admin Panel**
```
Request: GET /admin/users
App checks: Does user have ROLE_ADMIN?
Answer: No (you have ROLE_CUSTOMER and ROLE_PREMIUM_MEMBER)
Response: 403 Forbidden ❌
```

**7. You try to access Premium Deals**
```
Request: GET /premium/deals
App checks: Does user have ROLE_PREMIUM_MEMBER?
Answer: Yes! ✓
Response: 200 OK - Shows premium deals ✓
```

---

## Key Concepts Summary

### Access Token
- **What**: A JSON Web Token (JWT) containing your identity and roles
- **Lifespan**: Short (15 minutes to 1 hour)
- **Use**: Sent with every request to prove who you are
- **Format**: Encoded string that looks like: `eyJhbGciOiJSUzI1NiIs...`

### Refresh Token
- **What**: A special token used to get new access tokens
- **Lifespan**: Long (days to months)
- **Use**: Get a new access token when the old one expires
- **Security**: Stored securely, never sent to browser in pure SPA apps

### Authorization Code
- **What**: A temporary code proving you logged in
- **Lifespan**: Very short (seconds to minutes)
- **Use**: Exchange for access token (only used once!)
- **Security**: Single-use, expires quickly

### Roles
- **What**: Labels describing what you can do
- **Examples**: USER, ADMIN, MANAGER, VIEWER
- **Format in Spring**: Always prefixed with `ROLE_` (e.g., ROLE_ADMIN)
- **Use**: Control access to features and data

---

## Why Roles Matter: A Simple Example

Imagine a company management system:

### Without Roles (Bad!)
```
Everyone can do everything!
- Interns can delete the company
- Managers can't approve leave
- Employees can give themselves raises
```
**Chaos!** 😱

---

### With Roles (Good!)
```java
// Employee role
@PreAuthorize("hasRole('EMPLOYEE')")
- View own profile ✓
- Submit leave request ✓
- View own payslip ✓

// Manager role (has EMPLOYEE + more)
@PreAuthorize("hasRole('MANAGER')")
- Everything EMPLOYEE can do ✓
- Approve leave requests ✓
- View team performance ✓

// Admin role (has everything)
@PreAuthorize("hasRole('ADMIN')")
- Everything MANAGER can do ✓
- Manage users ✓
- Configure system ✓
- View all data ✓
```

**Organized!** 😊

---

## Common Questions Answered

### Q: Can I have multiple roles?
**A**: Yes! You can have as many roles as assigned.
```json
{
  "roles": ["USER", "MANAGER", "DEVELOPER", "TEAM_LEAD"]
}
```

### Q: What happens if my token is stolen?
**A**: The token will expire automatically. Short-lived tokens (15 min) limit the damage. The victim can also revoke the refresh token in Keycloak.

### Q: Do I need to send my token with every request?
**A**: After login, Spring Security creates a session. Your browser automatically sends a session cookie with each request. The app keeps your token in the session.

### Q: Can I use OAuth2 with mobile apps?
**A**: Yes! Mobile apps use a slightly different flow called "PKCE" (Proof Key for Code Exchange) for extra security.

### Q: What if Keycloak is down?
**A**: Users can't login, but existing users with valid tokens can continue working until tokens expire.

---

## The Bottom Line

OAuth2 is like a sophisticated security system:

1. **You prove who you are** to a trusted authority (Keycloak)
2. **You get a temporary pass** (Access Token) with your permissions (Roles)
3. **You show the pass** to access different areas
4. **The pass expires** automatically for security
5. **You can refresh** without logging in again

**The app never sees your password, and your access is controlled by roles!**

---

## Quick Troubleshooting Guide

### "I can't login!"
- ✓ Check Keycloak is running
- ✓ Check username/password are correct
- ✓ Check redirect URI matches in Keycloak settings

### "I get 403 Forbidden!"
- ✓ Check you have the required role in Keycloak
- ✓ Check role is being extracted (look at logs)
- ✓ Check role name matches (ADMIN vs admin)

### "I keep getting logged out!"
- ✓ Access token expiring too quickly (increase in Keycloak)
- ✓ Refresh token expired (login again)
- ✓ Session timeout too short (configure in Spring)

### "Roles aren't working!"
- ✓ Check @EnableMethodSecurity is present
- ✓ Check roles have ROLE_ prefix
- ✓ Check realm_access or resource_access in token
- ✓ Verify role mapping in Keycloak

---

**Remember**: OAuth2 + Roles = Secure, Controlled, User-Friendly Authentication! 🔐✨

# Spring Security OAuth2 with Keycloak
## A Complete Integration Tutorial

---

## Introduction

This tutorial provides a comprehensive explanation of integrating Spring Security with Keycloak as an OAuth2/OpenID Connect provider. We'll break down each component of your configuration, explain how OAuth2 authentication flows work, and detail how roles are extracted and mapped from Keycloak to Spring Security.

---

## Architecture Overview

### The OAuth2/OIDC Flow

Your application uses the Authorization Code flow, which is the most secure OAuth2 flow for web applications:

1. **User Access**: User attempts to access a protected resource
2. **Redirect to Keycloak**: Spring Security redirects to Keycloak login page
3. **Authentication**: User enters credentials in Keycloak
4. **Authorization Code**: Keycloak redirects back with authorization code
5. **Token Exchange**: Spring Security exchanges code for access token and ID token
6. **User Info**: Application extracts user details and roles from tokens
7. **Session Creation**: Spring Security creates authenticated session

---

## Application Configuration (application.yml)

### Server Configuration

```yaml
server:
  port: 8080
```

This sets your Spring Boot application to run on port 8080. Your application will be accessible at `http://localhost:8080`.

### OAuth2 Client Registration

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
```

This section configures your application as an OAuth2 client that will communicate with Keycloak.

#### client-id: democlient

The unique identifier for your application in Keycloak. This must match the client ID configured in your Keycloak realm. Think of it as your application's username when talking to Keycloak.

#### client-secret: change-me-secret

The secret key for your application. This is like a password that proves your application's identity to Keycloak. 

**IMPORTANT**: In production, this should be stored securely (environment variables, secrets manager) and never committed to version control.

#### scope: openid,profile,email

Scopes define what information your application requests from Keycloak:

- **openid**: Required for OpenID Connect; provides ID token
- **profile**: Access to user's profile information (name, username, etc.)
- **email**: Access to user's email address

#### authorization-grant-type: authorization_code

Specifies the OAuth2 flow type. The `authorization_code` flow is the most secure for web applications because the client secret is never exposed to the browser. The flow involves redirecting users to Keycloak, getting an authorization code, then exchanging it server-side for tokens.

#### redirect-uri: {baseUrl}/login/oauth2/code/{registrationId}

The callback URL where Keycloak sends the authorization code after successful login. The placeholders are resolved at runtime:

- **{baseUrl}**: Your application's base URL (`http://localhost:8080`)
- **{registrationId}**: The client registration name (`keycloak`)

**Final URL**: `http://localhost:8080/login/oauth2/code/keycloak`

### OAuth2 Provider Configuration

```yaml
spring:
  security:
    oauth2:
      client:
        provider:
          keycloak:
```

#### issuer-uri: http://localhost:8081/realms/demorealm

The base URL of your Keycloak realm. Spring Security uses this to auto-discover Keycloak's OAuth2 endpoints by accessing:

```
http://localhost:8081/realms/demorealm/.well-known/openid-configuration
```

This discovery document provides URLs for:

- Authorization endpoint (login page)
- Token endpoint (token exchange)
- User info endpoint (user details)
- JWKS endpoint (public keys for token verification)

#### user-name-attribute: preferred_username

Specifies which claim from the ID token should be used as the username in Spring Security. Keycloak provides several username-related claims (sub, preferred_username, name). The `preferred_username` is typically the user's login username, making it more human-readable than the `sub` (subject) claim, which is a UUID.

---

## Security Configuration (SecurityConfig.java)

### Class Annotations

#### @Configuration

Marks this class as a Spring configuration class, allowing Spring to process it during component scanning and register any @Bean methods.

#### @Slf4j

Lombok annotation that automatically generates a logger field named 'log' for debugging and monitoring purposes.

#### @EnableMethodSecurity

Enables method-level security annotations like `@PreAuthorize`, allowing you to secure individual methods with role checks. Without this, the `@PreAuthorize` annotation in your controller wouldn't work.

### Security Filter Chain Configuration

The `SecurityFilterChain` is the core of Spring Security configuration. It defines how incoming HTTP requests are secured.

#### Authorization Rules

```java
.requestMatchers("/error", "/login**").permitAll()
```

Allows unauthenticated access to error pages and login endpoints. The `**` wildcard matches any characters after `/login` (like `/login/oauth2/code/keycloak`).

```java
.requestMatchers("/admin/**").hasRole("ADMIN")
```

Restricts all URLs starting with `/admin/` to users with the ADMIN role. Spring Security automatically adds `ROLE_` prefix, so this checks for `ROLE_ADMIN`.

```java
.requestMatchers("/user/**").hasAnyRole("USER","ADMIN")
```

Allows access to `/user/` URLs for both USER and ADMIN roles. This demonstrates hierarchical access where admins can access user areas.

```java
.anyRequest().authenticated()
```

Any request not explicitly configured above requires authentication but no specific role. This is a secure default.

#### OAuth2 Login Configuration

```java
.oauth2Login()
```

Enables OAuth2/OpenID Connect login functionality. This configures Spring Security to:

- Redirect unauthenticated users to Keycloak
- Handle the OAuth2 callback
- Exchange authorization code for tokens
- Create Spring Security authentication object

```java
.userInfoEndpoint()
```

Configures how user information is loaded after authentication. This is where we customize role extraction.

```java
.oidcUserService(this.keycloakRolesOidcUserService())
```

Replaces the default OIDC user service with our custom implementation that extracts roles from Keycloak tokens. This is critical for role-based access control.

#### Logout Configuration

```java
.logout()
```

Configures logout behavior:

- **logoutUrl("/logout")**: The endpoint that triggers logout
- **logoutSuccessUrl("/")**: Redirect destination after logout
- **invalidateHttpSession(true)**: Destroys the HTTP session
- **clearAuthentication(true)**: Removes authentication from SecurityContext
- **deleteCookies("JSESSIONID")**: Removes session cookie from browser

**Note**: This only logs the user out of your application, not from Keycloak. For single sign-out from Keycloak, you would need to redirect to Keycloak's logout endpoint.

---

## Custom OIDC User Service (Role Extraction)

The `keycloakRolesOidcUserService()` method is the heart of role mapping. It extracts roles from Keycloak's token structure and converts them to Spring Security authorities.

### Method Structure

```java
private OAuth2UserService<OidcUserRequest, OidcUser> keycloakRolesOidcUserService()
```

**Return Type**: `OAuth2UserService<OidcUserRequest, OidcUser>`

Returns the interface type rather than the concrete `OidcUserService` class. This is important for proper Spring Security integration and allows the framework to wrap the service with additional functionality.

### Delegation Pattern

```java
OidcUserService delegate = new OidcUserService();
```

Creates the default OIDC user service that handles the standard OAuth2/OIDC operations (token validation, userinfo endpoint calls, etc.). We delegate to this service first, then enhance the result with custom role extraction.

### Token Claims Extraction

```java
OidcUser oidcUser = delegate.loadUser(userRequest);
```

Calls the default service to get the authenticated user. This validates tokens, retrieves user info, and creates the initial `OidcUser` object.

```java
Map<String, Object> claims = new HashMap<>(oidcUser.getClaims());
```

Creates a mutable copy of the user's claims (data fields from the token). Claims contain user information like username, email, and roles.

```java
userRequest.getIdToken().getClaims().forEach(claims::putIfAbsent);
```

Merges ID token claims into our map. The ID token may contain claims not present in the userInfo response. `putIfAbsent` ensures we don't overwrite existing claims.

### Realm Roles Extraction

Keycloak stores realm-level roles (roles available across all clients in the realm) in a nested structure:

**Token Structure**:
```json
{
  "realm_access": {
    "roles": ["user", "admin"]
  }
}
```

**Code Explanation**:

```java
Object realmAccess = claims.get("realm_access");
```

Retrieves the `realm_access` claim, which may or may not exist.

```java
if (realmAccess instanceof Map<?, ?> m)
```

Type-safe check that `realm_access` is a Map. The `m` is a pattern variable (Java 16+) that gives us a typed reference.

```java
Object realmRoles = m.get("roles");
```

Extracts the roles array from within `realm_access`.

```java
if (realmRoles instanceof Collection<?> c)
```

Checks if roles is a Collection (typically a List).

```java
c.forEach(r -> roles.add(String.valueOf(r)));
```

Adds each role to our Set, converting to String for safety. The Set automatically prevents duplicates.

### Client Roles Extraction

Client-specific roles (roles that only apply to your specific application) are stored in a different structure:

**Token Structure**:
```json
{
  "resource_access": {
    "democlient": {
      "roles": ["manager", "viewer"]
    }
  }
}
```

**Code Explanation**:

```java
String clientId = userRequest.getClientRegistration().getClientId();
```

Gets your application's client ID (`democlient`) to look up the correct roles. This ensures we only extract roles assigned to our specific application.

```java
Object clientEntry = m.get(clientId);
```

Retrieves the client-specific section from `resource_access`.

```java
log.error(c.toString());
```

Debug logging to see what roles are being extracted. 

**Note**: This uses `log.error()` which is likely a mistake - it should be `log.debug()` or `log.info()` in production.

### Role Mapping to Spring Security Authorities

Spring Security uses the `GrantedAuthority` interface to represent permissions. We need to convert Keycloak's role strings into Spring Security authorities:

**Stream Pipeline**:

```java
roles.stream()
```

Creates a stream from our collected roles Set.

```java
.filter(Objects::nonNull)
```

Removes any null values for safety.

```java
.map(String::trim)
```

Removes leading/trailing whitespace from role names.

```java
.filter(s -> !s.isEmpty())
```

Excludes empty strings.

```java
.map(s -> "ROLE_" + s.toUpperCase())
```

**Critical transformation**: Adds `ROLE_` prefix and converts to uppercase. Spring Security's `hasRole()` matcher expects this format. For example, `'admin'` becomes `'ROLE_ADMIN'`.

```java
.map(SimpleGrantedAuthority::new)
```

Creates Spring Security `GrantedAuthority` objects from the role strings.

```java
.collect(Collectors.toSet())
```

Collects all authorities into a Set, automatically eliminating duplicates.

### Authority Merging

```java
Set<GrantedAuthority> combined = new HashSet<>(oidcUser.getAuthorities());
```

Starts with the default authorities from the OIDC user (which might include OIDC-specific authorities).

```java
combined.addAll(mapped);
```

Adds our custom-mapped Keycloak roles to the authority set. This ensures the user has both default OIDC authorities and role-based authorities.

### Username Attribute Selection

```java
String nameAttribute = oidcUser.getUserInfo() != null && 
    oidcUser.getUserInfo().hasClaim("preferred_username")
    ? "preferred_username" : "sub";
```

Determines which claim to use as the username:

- Prefers `preferred_username` (human-readable username like 'john.doe')
- Falls back to `sub` (subject claim, typically a UUID like '123e4567-e89b')

The `sub` claim is guaranteed to be present in ID tokens, making it a safe fallback.

### Creating Enhanced OIDC User

```java
return new DefaultOidcUser(combined, userRequest.getIdToken(), 
    oidcUser.getUserInfo(), nameAttribute);
```

Creates a new `DefaultOidcUser` with:

- **combined**: All authorities (default + Keycloak roles)
- **userRequest.getIdToken()**: The ID token from Keycloak
- **oidcUser.getUserInfo()**: User info from the userInfo endpoint
- **nameAttribute**: Which claim represents the username

---

## Controller (DemoController.java)

### Basic Endpoint

```java
@GetMapping("/api/me")
public String me() { return "hello, authenticated user"; }
```

Accessible to any authenticated user. No specific role required because the SecurityFilterChain's `anyRequest().authenticated()` rule applies.

### Role-Protected Endpoint

```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/secret")
public String adminOnly() { return "only admins"; }
```

Method-level security annotation that checks if the user has the ADMIN role before allowing method execution. This annotation only works because we enabled `@EnableMethodSecurity` in SecurityConfig.

Spring Security automatically adds `ROLE_` prefix to the role name, so `hasRole('ADMIN')` checks for `ROLE_ADMIN` authority.

---

## Keycloak Configuration Guide

### Step 1: Create a Realm

1. Access Keycloak admin console (`http://localhost:8081`)
2. Click the realm dropdown in the top-left corner
3. Click 'Create Realm'
4. Name it `demorealm` (must match issuer-uri in application.yml)
5. Click 'Create'

### Step 2: Create a Client

1. Navigate to **Clients** → **Create client**
2. **General Settings**:
   - Client ID: `democlient`
   - Name: Demo Client (optional, for display)
   - Client Protocol: `openid-connect`
3. **Capability config**:
   - Client authentication: **ON** (enables client secret)
   - Authorization: **OFF** (not needed for basic OAuth2)
   - Standard flow: **ON** (authorization code flow)
   - Direct access grants: **OFF** (we use OAuth2, not direct login)
4. **Login settings**:
   - Valid redirect URIs: `http://localhost:8080/login/oauth2/code/keycloak`
   - Web origins: `http://localhost:8080` (for CORS)
5. Save the client
6. Go to **Credentials** tab and copy the **Client Secret**
7. Update application.yml with the real secret

### Step 3: Create Roles

#### Realm Roles (Global)

1. Navigate to **Realm roles** → **Create role**
2. Create roles: `user`, `admin`
3. These will be accessible to all clients in the realm

#### Client Roles (Application-Specific)

1. Navigate to **Clients** → **democlient** → **Roles** tab
2. Click **'Create role'**
3. Create roles specific to your application (e.g., `manager`, `viewer`)
4. These roles only apply to `democlient`

### Step 4: Create Users and Assign Roles

1. Navigate to **Users** → **Create new user**
2. Fill in user details:
   - Username: `testuser`
   - Email: `testuser@example.com`
   - First/Last Name: Test User
3. Click **'Create'**
4. Go to **Credentials** tab → **Set password** → Set temporary: **OFF**
5. Go to **Role mapping** tab:
   - Click **'Assign role'**
   - Filter by realm roles → Select `user` or `admin`
   - Filter by clients → Select `democlient` → Assign client roles

### Step 5: Configure Token Claims

By default, Keycloak includes roles in tokens, but you should verify:

1. Navigate to **Client scopes** → **roles**
2. Check **Mappers** tab for:
   - **realm roles**: Maps `realm_access.roles`
   - **client roles**: Maps `resource_access.{client}.roles`

---

## Testing Your Application

### Starting the Application

1. Ensure Keycloak is running on port 8081
2. Start your Spring Boot application
3. Navigate to `http://localhost:8080/api/me`
4. You'll be redirected to Keycloak login

### Authentication Flow

1. Enter credentials in Keycloak
2. Keycloak redirects back to your app with authorization code
3. Spring Security exchanges code for tokens
4. Your custom user service extracts roles
5. Session is created with authenticated user
6. You'll see `'hello, authenticated user'`

### Testing Role-Based Access

**Test with User Role**:
- `/api/me`: ✓ Should work
- `/api/admin/secret`: ✗ Should get 403 Forbidden

**Test with Admin Role**:
- `/api/me`: ✓ Should work
- `/api/admin/secret`: ✓ Should work

---

## Common Issues and Troubleshooting

### Issue 1: Redirect URI Mismatch

**Error**: Invalid redirect URI or client not found

**Solution**:
- Verify redirect URI in Keycloak client matches exactly
- Check for trailing slashes or typos
- Ensure client ID in application.yml matches Keycloak

### Issue 2: Roles Not Being Extracted

**Error**: 403 Forbidden even with correct role

**Solution**:
- Check the `log.error()` output to see what roles are being extracted
- Verify roles are assigned to the user in Keycloak
- Ensure role names match (case-sensitive before uppercase conversion)
- Check that `realm_access` and `resource_access` are in token claims

### Issue 3: Connection Refused to Keycloak

**Error**: Cannot connect to http://localhost:8081

**Solution**:
- Verify Keycloak is running: `curl http://localhost:8081`
- Check firewall settings
- Verify port 8081 is not being used by another service

### Issue 4: Invalid Client Secret

**Error**: Unauthorized client

**Solution**:
- Get fresh client secret from Keycloak Credentials tab
- Update application.yml with correct secret
- Restart Spring Boot application

---

## Security Best Practices

### 1. Environment-Based Configuration

Never hardcode secrets in application.yml. Use environment variables or a secrets manager:

```yaml
client-secret: ${KEYCLOAK_CLIENT_SECRET}
```

### 2. HTTPS in Production

Always use HTTPS in production:

- Protects tokens in transit
- Prevents man-in-the-middle attacks
- Required by OAuth2 specification

### 3. Token Validation

Spring Security automatically validates:

- Token signature using Keycloak's public keys
- Token expiration
- Issuer claim matches issuer-uri
- Audience claim matches client ID

### 4. Principle of Least Privilege

- Assign minimum necessary roles to users
- Create specific client roles rather than using only realm roles
- Regularly audit role assignments

### 5. Session Management

- Configure appropriate session timeout
- Implement proper logout including Keycloak session termination
- Use secure session cookies (httpOnly, secure, sameSite)

---

## Advanced Topics

### 1. Custom Claims Extraction

You can extract additional custom claims from tokens by modifying the `keycloakRolesOidcUserService` method. For example, to extract organization or department information:

```java
String organization = claims.get("organization") != null 
    ? claims.get("organization").toString() 
    : null;
```

### 2. Token Refresh

Spring Security automatically handles token refresh using the refresh token. When the access token expires, it will use the refresh token to obtain a new access token without requiring re-authentication.

### 3. Single Logout

To implement single logout (logout from both your app and Keycloak), configure a custom logout success handler that redirects to Keycloak's `end_session_endpoint` with the ID token.

### 4. Multi-Tenancy

For multi-tenant applications, you can configure multiple OAuth2 client registrations pointing to different Keycloak realms or different identity providers. Spring Security will let users choose which provider to authenticate with.

---

## Conclusion

This tutorial covered the complete integration of Spring Security with Keycloak for OAuth2/OpenID Connect authentication. You learned:

- How OAuth2 authorization code flow works
- Configuration of Spring Security OAuth2 client
- Custom role extraction from Keycloak tokens
- Role-based access control with Spring Security
- Keycloak realm, client, and role configuration
- Security best practices and troubleshooting

This setup provides a solid foundation for enterprise-grade authentication and authorization. You can extend it with additional features like custom claims, single logout, and multi-tenancy as your application requirements grow.

---

## Quick Reference

### Key Configuration Properties

| Property | Value | Purpose |
|----------|-------|---------|
| server.port | 8080 | Application port |
| client-id | democlient | OAuth2 client identifier |
| client-secret | (secret) | OAuth2 client credential |
| issuer-uri | http://localhost:8081/realms/demorealm | Keycloak realm base URL |
| redirect-uri | {baseUrl}/login/oauth2/code/{registrationId} | OAuth2 callback URL |

### Role Mapping Flow

```
Keycloak Token → Extract Claims → Filter & Transform → Add ROLE_ prefix → 
Convert to GrantedAuthority → Merge with Default Authorities → Create OidcUser
```

### Important Annotations

- `@Configuration` - Spring configuration class
- `@EnableMethodSecurity` - Enable method-level security
- `@PreAuthorize("hasRole('ROLE')")` - Protect methods with roles
- `@Slf4j` - Lombok logger

### Useful Commands

```bash
# Check if Keycloak is running
curl http://localhost:8081

# View Keycloak discovery document
curl http://localhost:8081/realms/demorealm/.well-known/openid-configuration

# Test your application
curl http://localhost:8080/api/me
```

---
