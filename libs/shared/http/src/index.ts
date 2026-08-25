export { isAppError, toAppError, type AppError } from './lib/app-error';
export {
  ACTIVE_SCOPE_PROVIDER,
  LOCALE_PREFERENCE_PROVIDER,
  SCOPE_BOUND,
  SESSION_CREDENTIAL_PROVIDER,
  scopeBound,
  type ActiveScope,
  type SessionCredentialProvider,
} from './lib/tokens';
export { FRONTEND_REQUEST_ID_HEADER } from './lib/interceptors/request-id.interceptor';
export { provideHttpInfrastructure } from './lib/provide-http-infrastructure';
