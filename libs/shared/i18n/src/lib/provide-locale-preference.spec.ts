import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@crm/shared/config';
import { provideHttpInfrastructure } from '@crm/shared/http';
import { LanguageStore } from './language.store';
import { provideLocalePreference } from './provide-locale-preference';

describe('locale interceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost/api',
            socketUrl: 'ws://localhost/ws',
            enabledChannels: [],
            enabledAiCapabilities: [],
            featureFlagDefaults: {},
          },
        },
        provideHttpInfrastructure(),
        provideLocalePreference(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('sends the active language as Accept-Language', () => {
    TestBed.inject(LanguageStore).setLanguage('ar');
    TestBed.inject(HttpClient).get('/api/x').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/x');
    expect(request.request.headers.get('Accept-Language')).toBe('ar');
  });
});
