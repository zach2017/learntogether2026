package com.example.oauth.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.*;

@Service
public class TokenService {
    
    private final RSAKey rsaKey;
    private final JWKSet jwkSet;
    
    public TokenService() {
        try {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            KeyPair keyPair = gen.generateKeyPair();
            
            this.rsaKey = new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyUse(KeyUse.SIGNATURE)
                    .keyID(UUID.randomUUID().toString())
                    .build();
            
            this.jwkSet = new JWKSet(rsaKey);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate RSA keys", e);
        }
    }
    
    public String generateAccessToken(String username, String clientId) {
        try {
            Date now = new Date();
            Date expiry = new Date(now.getTime() + 3600000); // 1 hour
            
            List<String> roles = Arrays.asList("USER", "ADMIN", "UPLOAD_ONLY");
            List<String> groups = Arrays.asList("ADMIN", "USER");
            
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(username)
                    .issuer("http://localhost:8080")
                    .audience(clientId)
                    .issueTime(now)
                    .expirationTime(expiry)
                    .notBeforeTime(now)
                    .jwtID(UUID.randomUUID().toString())
                    .claim("preferred_username", username)
                    .claim("email", username + "@example.com")
                    .claim("email_verified", true)
                    .claim("name", "Test User")
                    .claim("given_name", "Test")
                    .claim("family_name", "User")
                    .claim("scope", "openid profile email")
                    .claim("azp", clientId)
                    .claim("realm_access", Map.of("roles", roles))
                    .claim("resource_access", Map.of(
                            clientId, Map.of("roles", roles)
                    ))
                    .claim("groups", groups)
                    .claim("roles", roles)
                    .build();
            
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .keyID(rsaKey.getKeyID())
                    .type(JOSEObjectType.JWT)
                    .build();
            
            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            JWSSigner signer = new RSASSASigner(rsaKey);
            signedJWT.sign(signer);
            
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate access token", e);
        }
    }
    
    public String generateIdToken(String username, String clientId, String nonce) {
        try {
            Date now = new Date();
            Date expiry = new Date(now.getTime() + 3600000); // 1 hour
            
            JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                    .subject(username)
                    .issuer("http://localhost:8080")
                    .audience(clientId)
                    .issueTime(now)
                    .expirationTime(expiry)
                    .claim("auth_time", now.getTime() / 1000)
                    .claim("preferred_username", username)
                    .claim("email", username + "@example.com")
                    .claim("email_verified", true)
                    .claim("name", "Test User")
                    .claim("given_name", "Test")
                    .claim("family_name", "User");
            
            if (nonce != null) {
                claimsBuilder.claim("nonce", nonce);
            }
            
            JWTClaimsSet claimsSet = claimsBuilder.build();
            
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .keyID(rsaKey.getKeyID())
                    .type(JOSEObjectType.JWT)
                    .build();
            
            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            JWSSigner signer = new RSASSASigner(rsaKey);
            signedJWT.sign(signer);
            
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate ID token", e);
        }
    }
    
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }
    
    public JWKSet getJwkSet() {
        return jwkSet;
    }
    
    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new RSASSAVerifier(rsaKey);
            return signedJWT.verify(verifier);
        } catch (Exception e) {
            return false;
        }
    }
}