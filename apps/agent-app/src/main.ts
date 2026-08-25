import { bootstrapApplication } from '@angular/platform-browser';
import { loadAppConfig } from '@crm/shared/config';
import { AppComponent } from './app/app.component';
import { buildAppConfig } from './app/app.config';

loadAppConfig()
  .then((runtime) =>
    bootstrapApplication(AppComponent, buildAppConfig(runtime)),
  )
  .catch((error) => {
    // Configuration failure is fatal and must be visible, not silent.
    console.error('Application configuration failed to load.', error);
    document.body.textContent = 'Application configuration failed to load.';
  });
