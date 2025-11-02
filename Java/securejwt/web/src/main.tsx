import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from "react-oidc-context";
import App from "./App";

const oidcConfig = {
  authority: "http://localhost:8081/realms/demorealm",
  client_id: "democlient",
  scope: "openid profile email", // Standard scopes
  redirect_uri: window.location.origin,
  // ...
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <AuthProvider {...oidcConfig}>
    <App />
    </AuthProvider>
  </StrictMode>,
)
