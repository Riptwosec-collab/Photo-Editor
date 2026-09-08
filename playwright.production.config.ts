import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./e2e',testMatch:/offline-production.spec.ts/,workers:1,retries:0,use:{baseURL:'http://127.0.0.1:3100',trace:'retain-on-failure'},webServer:{command:'npm run start -- --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}]});
