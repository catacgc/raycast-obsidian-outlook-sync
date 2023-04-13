// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const settings: AppSettings = {
  'clientId': '5f7ada71-d950-454a-8434-a537a2b924bf',
  'clientSecret': 'YOUR_CLIENT_SECRET_HERE_IF_USING_APP_ONLY',
  'tenantId': 'YOUR_TENANT_ID_HERE_IF_USING_APP_ONLY',
  'authTenant': 'common',
  'graphUserScopes': [
    'user.read',
    'mail.read',
    'mail.send'
  ]
};

export interface AppSettings {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  authTenant: string;
  graphUserScopes: string[];
}

export default settings;
