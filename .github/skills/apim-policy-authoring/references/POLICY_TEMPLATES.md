# APIM Policy Templates

Production-ready Azure API Management policy XML templates with authentication, rate limiting, CORS, error handling, and security headers.

---

## Template 1: Hybrid Authentication (OAuth + Subscription Keys)

**Use when**: Public API with OAuth option for premium users, fallback to subscription keys for basic access

**Key Features**:
- OAuth users: 1000 requests/hour **per user** (JWT `sub` claim)
- Subscription key users: 500 requests/hour **per subscription**
- Correlation ID for request tracing
- Standardized error responses
- Security headers

```xml
<policies>
    <inbound>
        <base />
        
        <!-- Generate correlation ID for request tracing -->
        <set-variable name="correlationId" value="@(Guid.NewGuid().ToString())" />
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>

        <!-- Hybrid Authentication: OAuth or Subscription Key -->
        <choose>
            <!-- Option 1: OAuth 2.0 Bearer Token -->
            <when condition="@(context.Request.Headers.GetValueOrDefault('Authorization','').StartsWith('Bearer'))">
                
                <!-- Validate JWT token -->
                <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized">
                    <openid-config url="https://login.microsoftonline.com/{{TENANT_ID}}/v2.0/.well-known/openid-configuration" />
                    <audiences>
                        <audience>api://{{API_CLIENT_ID}}</audience>
                    </audiences>
                    <required-claims>
                        <claim name="scp" match="any">
                            <value>api.read</value>
                            <value>api.write</value>
                        </claim>
                    </required-claims>
                </validate-jwt>

                <!-- Extract user ID from JWT for per-user rate limiting -->
                <set-variable name="userId" value="@(context.Request.Headers.GetValueOrDefault('Authorization','').AsJwt()?.Subject)" />
                
                <!-- Rate limiting: 1000 requests/hour per OAuth user -->
                <rate-limit-by-key calls="1000" renewal-period="3600" 
                                   counter-key="@((string)context.Variables['userId'])"
                                   increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)" />
                
                <!-- Add user context to backend request -->
                <set-header name="X-User-ID" exists-action="override">
                    <value>@((string)context.Variables["userId"])</value>
                </set-header>
                <set-header name="X-Auth-Method" exists-action="override">
                    <value>OAuth</value>
                </set-header>
            </when>

            <!-- Option 2: Subscription Key (fallback) -->
            <otherwise>
                <!-- Check subscription key exists -->
                <check-header name="Ocp-Apim-Subscription-Key" failed-check-httpcode="401" failed-check-error-message="Missing subscription key" />
                
                <!-- Rate limiting: 500 requests/hour per subscription -->
                <rate-limit-by-key calls="500" renewal-period="3600" 
                                   counter-key="@(context.Subscription.Key)"
                                   increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)" />
                
                <!-- Add subscription context to backend request -->
                <set-header name="X-Subscription-ID" exists-action="override">
                    <value>@(context.Subscription.Id)</value>
                </set-header>
                <set-header name="X-Auth-Method" exists-action="override">
                    <value>SubscriptionKey</value>
                </set-header>
            </otherwise>
        </choose>

        <!-- CORS Configuration -->
        <cors allow-credentials="true">
            <allowed-origins>
                <origin>https://app.example.com</origin>
                <origin>https://portal.example.com</origin>
            </allowed-origins>
            <allowed-methods>
                <method>GET</method>
                <method>POST</method>
                <method>PUT</method>
                <method>DELETE</method>
            </allowed-methods>
            <allowed-headers>
                <header>Authorization</header>
                <header>Content-Type</header>
                <header>Ocp-Apim-Subscription-Key</header>
            </allowed-headers>
            <expose-headers>
                <header>X-Correlation-ID</header>
            </expose-headers>
        </cors>
    </inbound>

    <backend>
        <base />
    </backend>

    <outbound>
        <base />
        
        <!-- Remove backend internal headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        <set-header name="Server" exists-action="delete" />
        
        <!-- Add security headers -->
        <set-header name="X-Content-Type-Options" exists-action="override">
            <value>nosniff</value>
        </set-header>
        <set-header name="X-Frame-Options" exists-action="override">
            <value>DENY</value>
        </set-header>
        <set-header name="Strict-Transport-Security" exists-action="override">
            <value>max-age=31536000; includeSubDomains</value>
        </set-header>
        
        <!-- Ensure correlation ID in response -->
        <set-header name="X-Correlation-ID" exists-action="skip">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
    </outbound>

    <on-error>
        <!-- Structured error response -->
        <set-body>@{
            return new JObject(
                new JProperty("error", new JObject(
                    new JProperty("code", context.LastError.Source),
                    new JProperty("message", context.LastError.Message),
                    new JProperty("correlationId", context.Variables["correlationId"]),
                    new JProperty("timestamp", DateTime.UtcNow.ToString("o"))
                ))
            ).ToString();
        }</set-body>
        
        <set-header name="Content-Type" exists-action="override">
            <value>application/json</value>
        </set-header>
        
        <!-- Add correlation ID to error response -->
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
        
        <!-- Log error to Application Insights -->
        <log-to-eventhub logger-id="app-insights-logger">@{
            return new JObject(
                new JProperty("correlationId", context.Variables["correlationId"]),
                new JProperty("error", context.LastError.Message),
                new JProperty("source", context.LastError.Source),
                new JProperty("apiId", context.Api.Id),
                new JProperty("operationId", context.Operation.Id),
                new JProperty("timestamp", DateTime.UtcNow)
            ).ToString();
        }</log-to-eventhub>
    </on-error>
</policies>
```

**Customization Points**:
1. **{{TENANT_ID}}**: Replace with your Entra ID tenant ID (for internal APIs) or Entra External ID tenant (for B2C)
2. **{{API_CLIENT_ID}}**: Replace with your API application registration client ID
3. **Rate limits**: Adjust `calls="1000"` and `calls="500"` based on your API capacity
4. **CORS origins**: Update `<allowed-origins>` with your actual frontend domains
5. **Required claims**: Modify `<claim name="scp">` values for your API scopes

**Testing**:
```bash
# OAuth request
curl -H "Authorization: Bearer <JWT_TOKEN>" https://your-api.azure-api.net/api/resource

# Subscription key request
curl -H "Ocp-Apim-Subscription-Key: <SUBSCRIPTION_KEY>" https://your-api.azure-api.net/api/resource
```

---

## Template 2: OAuth Only (Internal APIs)

**Use when**: Internal corporate APIs requiring user authentication with Entra ID

**Key Features**:
- Enforces OAuth 2.0 only (no subscription key fallback)
- Validates JWT with required claims (scopes, roles)
- Extracts user email and ID for backend context
- Higher rate limit (10,000 requests/hour for internal use)

```xml
<policies>
    <inbound>
        <base />
        
        <!-- Generate correlation ID -->
        <set-variable name="correlationId" value="@(Guid.NewGuid().ToString())" />
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>

        <!-- Validate JWT token (Entra ID) -->
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized: Valid OAuth token required">
            <openid-config url="https://login.microsoftonline.com/{{CORPORATE_TENANT_ID}}/v2.0/.well-known/openid-configuration" />
            <audiences>
                <audience>api://{{INTERNAL_API_CLIENT_ID}}</audience>
            </audiences>
            <required-claims>
                <claim name="scp" match="any">
                    <value>Employee.Read</value>
                    <value>Employee.Write</value>
                </claim>
            </required-claims>
            <issuers>
                <issuer>https://login.microsoftonline.com/{{CORPORATE_TENANT_ID}}/v2.0</issuer>
            </issuers>
        </validate-jwt>

        <!-- Extract user claims -->
        <set-variable name="jwt" value="@(context.Request.Headers.GetValueOrDefault('Authorization','').AsJwt())" />
        <set-variable name="userId" value="@(((Jwt)context.Variables['jwt']).Subject)" />
        <set-variable name="userEmail" value="@(((Jwt)context.Variables['jwt']).Claims.GetValueOrDefault('email', 'unknown'))" />
        <set-variable name="userName" value="@(((Jwt)context.Variables['jwt']).Claims.GetValueOrDefault('name', 'unknown'))" />

        <!-- Rate limiting: 10,000 requests/hour per user (internal API, higher limit) -->
        <rate-limit-by-key calls="10000" renewal-period="3600" 
                           counter-key="@((string)context.Variables['userId'])"
                           increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)" />

        <!-- Add user context headers for backend -->
        <set-header name="X-User-ID" exists-action="override">
            <value>@((string)context.Variables["userId"])</value>
        </set-header>
        <set-header name="X-User-Email" exists-action="override">
            <value>@((string)context.Variables["userEmail"])</value>
        </set-header>
        <set-header name="X-User-Name" exists-action="override">
            <value>@((string)context.Variables["userName"])</value>
        </set-header>
        
        <!-- Remove original Authorization header (backend doesn't need JWT) -->
        <!-- Uncomment if backend should NOT receive bearer token -->
        <!-- <set-header name="Authorization" exists-action="delete" /> -->
    </inbound>

    <backend>
        <base />
    </backend>

    <outbound>
        <base />
        
        <!-- Remove user context headers from response (security) -->
        <set-header name="X-User-ID" exists-action="delete" />
        <set-header name="X-User-Email" exists-action="delete" />
        <set-header name="X-User-Name" exists-action="delete" />
        
        <!-- Remove backend internal headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        <set-header name="Server" exists-action="delete" />
        
        <!-- Add security headers -->
        <set-header name="X-Content-Type-Options" exists-action="override">
            <value>nosniff</value>
        </set-header>
        <set-header name="X-Frame-Options" exists-action="override">
            <value>DENY</value>
        </set-header>
        <set-header name="Strict-Transport-Security" exists-action="override">
            <value>max-age=31536000; includeSubDomains</value>
        </set-header>
        
        <!-- Ensure correlation ID in response -->
        <set-header name="X-Correlation-ID" exists-action="skip">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
    </outbound>

    <on-error>
        <!-- Structured error response (same as Template 1) -->
        <set-body>@{
            return new JObject(
                new JProperty("error", new JObject(
                    new JProperty("code", context.LastError.Source),
                    new JProperty("message", context.LastError.Message),
                    new JProperty("correlationId", context.Variables["correlationId"]),
                    new JProperty("timestamp", DateTime.UtcNow.ToString("o"))
                ))
            ).ToString();
        }</set-body>
        
        <set-header name="Content-Type" exists-action="override">
            <value>application/json</value>
        </set-header>
        
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
        
        <log-to-eventhub logger-id="app-insights-logger">@{
            return new JObject(
                new JProperty("correlationId", context.Variables["correlationId"]),
                new JProperty("error", context.LastError.Message),
                new JProperty("source", context.LastError.Source),
                new JProperty("apiId", context.Api.Id),
                new JProperty("operationId", context.Operation.Id),
                new JProperty("userId", context.Variables.GetValueOrDefault("userId", "unknown")),
                new JProperty("timestamp", DateTime.UtcNow)
            ).ToString();
        }</log-to-eventhub>
    </on-error>
</policies>
```

**Customization Points**:
1. **{{CORPORATE_TENANT_ID}}**: Your corporate Entra ID tenant ID
2. **{{INTERNAL_API_CLIENT_ID}}**: API app registration client ID in corporate tenant
3. **Required scopes**: Update `<claim name="scp">` values (e.g., `Employee.Read`, `Employee.Write`)
4. **Rate limit**: Adjust `calls="10000"` based on internal API capacity
5. **User claims**: Modify extracted claims (`email`, `name`) based on your token structure

---

## Template 3: Subscription Key Only (Simple Public API)

**Use when**: Public read-only API, no sensitive data, simple authentication sufficient

```xml
<policies>
    <inbound>
        <base />
        
        <!-- Generate correlation ID -->
        <set-variable name="correlationId" value="@(Guid.NewGuid().ToString())" />
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>

        <!-- Validate subscription key -->
        <check-header name="Ocp-Apim-Subscription-Key" failed-check-httpcode="401" failed-check-error-message="Missing or invalid subscription key" />
        
        <!-- Rate limiting: 500 requests/hour per subscription -->
        <rate-limit-by-key calls="500" renewal-period="3600" 
                           counter-key="@(context.Subscription.Key)"
                           increment-condition="@(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)" />
        
        <!-- CORS Configuration for browser access -->
        <cors allow-credentials="false">
            <allowed-origins>
                <origin>*</origin>
            </allowed-origins>
            <allowed-methods>
                <method>GET</method>
            </allowed-methods>
            <allowed-headers>
                <header>Ocp-Apim-Subscription-Key</header>
            </allowed-headers>
            <expose-headers>
                <header>X-Correlation-ID</header>
            </expose-headers>
        </cors>
    </inbound>

    <backend>
        <base />
    </backend>

    <outbound>
        <base />
        
        <!-- Remove backend internal headers -->
        <set-header name="X-Powered-By" exists-action="delete" />
        <set-header name="Server" exists-action="delete" />
        
        <!-- Add security headers -->
        <set-header name="X-Content-Type-Options" exists-action="override">
            <value>nosniff</value>
        </set-header>
        
        <!-- Correlation ID -->
        <set-header name="X-Correlation-ID" exists-action="skip">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
    </outbound>

    <on-error>
        <set-body>@{
            return new JObject(
                new JProperty("error", new JObject(
                    new JProperty("code", context.LastError.Source),
                    new JProperty("message", context.LastError.Message),
                    new JProperty("correlationId", context.Variables["correlationId"]),
                    new JProperty("timestamp", DateTime.UtcNow.ToString("o"))
                ))
            ).ToString();
        }</set-body>
        
        <set-header name="Content-Type" exists-action="override">
            <value>application/json</value>
        </set-header>
        
        <set-header name="X-Correlation-ID" exists-action="override">
            <value>@((string)context.Variables["correlationId"])</value>
        </set-header>
    </on-error>
</policies>
```

**Customization Points**:
1. **CORS origins**: Update `<origin>*</origin>` to specific domains for production
2. **Rate limit**: Adjust `calls="500"` based on API capacity
3. **Allowed methods**: Add POST/PUT/DELETE if not read-only

---

**Template Version**: 1.0  
**Last Updated**: 29 January 2026  
**Related Document**: APIM_PLATFORM_BASELINE_POLICIES.md
