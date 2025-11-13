package com.example.auth;
import com.nimbusds.jose.jwk.RSAKey;
import java.security.*;
import java.security.interfaces.*;
import java.util.UUID;
public final class Jwks {
  private Jwks(){}
  public static RSAKey generateRsa(){
    try{
      KeyPairGenerator gen=KeyPairGenerator.getInstance("RSA");
      gen.initialize(2048);
      KeyPair kp=gen.generateKeyPair();
      return new RSAKey.Builder((RSAPublicKey)kp.getPublic())
       .privateKey((RSAPrivateKey)kp.getPrivate())
       .keyID(UUID.randomUUID().toString()).build();
    }catch(Exception e){throw new IllegalStateException(e);}
  }
}