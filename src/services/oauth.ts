import {OAuth} from "@raycast/api";
import fetch from "node-fetch";
import settings from "./appSettings";


export const client = new OAuth.PKCEClient({
    redirectMethod: OAuth.RedirectMethod.Web,
    providerName: "Outlook",
    providerIcon: "msft.png",
    description: "Connect your Msft account..."
});

export async function authorize(): Promise<string | undefined> {
    const tokenSet = await client.getTokens();

    if (tokenSet?.accessToken) {
        try {
            if (tokenSet.refreshToken && tokenSet.isExpired()) {

                const tokens = await refreshTokens(tokenSet.refreshToken);
                await client.setTokens(tokens);
                return tokens.access_token

            }

            return tokenSet.accessToken;
        } catch (e) {
            console.log(e)
        }
    }

    const authRequest = await client.authorizationRequest({
        endpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        clientId: settings.clientId,
        scope: 'user.read Mail.ReadWrite Calendars.Read Calendars.ReadWrite',
        extraParameters: {
            "redirect_uri": "https://www.raycast.com/redirect/Extension"
        }
    });

    const {authorizationCode} = await client.authorize(authRequest);
    const tokens: OAuth.TokenResponse = await fetchTokens(authRequest, authorizationCode);
    await client.setTokens(tokens);

    return tokens.access_token
}

export async function getAccessToken(): Promise<string | undefined> {
    const token = await client.getTokens()
    return token?.accessToken
}


async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string): Promise<OAuth.TokenResponse> {
    const params = new URLSearchParams();
    params.append("client_id", settings.clientId);
    params.append("code", authCode);
    params.append("state", authRequest.state);
    params.append("code_verifier", authRequest.codeVerifier);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", "https://www.raycast.com/redirect/Extension");

    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        body: params,
        headers: {
            "Origin": "http://localhost"
        }
    });
    if (!response.ok) {
        console.error("fetch tokens error:", await response.text());
        throw new Error(response.statusText);
    }
    return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
    const params = new URLSearchParams();
    params.append("client_id", settings.clientId);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");
    params.append("redirect_uri", "https://www.raycast.com/redirect/Extension")

    const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST", body: params,
        headers: {
            "Origin": "http://localhost"
        }
    });
    if (!response.ok) {
        console.error("refresh tokens error:", await response.text());
        throw new Error(response.statusText);
    }
    const tokenResponse = (await response.json()) as OAuth.TokenResponse;
    tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
    return tokenResponse;
}