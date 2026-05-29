import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { analyticsPromise } from './app/firebase';

void analyticsPromise;

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
