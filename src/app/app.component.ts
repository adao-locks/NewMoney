import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'NewMoney - Gestão financeira';
  darkMode = false;

  constructor(public auth: AuthService) {
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.setThemeClass(this.darkMode);
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.setThemeClass(this.darkMode);
  }

  private setThemeClass(isDark: boolean) {
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  logout() {
    this.auth.logout();
  }
}
