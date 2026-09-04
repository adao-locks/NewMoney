import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { PerfilComponent } from './components/perfil/perfil.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, PerfilComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'NewMoney - Gestão financeira';
  darkMode = false;
  profileModalOpen = false;

  constructor(public auth: AuthService) {
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.setThemeClass(this.darkMode);
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.setThemeClass(this.darkMode);
  }

  openProfileModal() {
    this.profileModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeProfileModal() {
    this.profileModalOpen = false;
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.profileModalOpen) {
      this.closeProfileModal();
    }
  }

  private setThemeClass(isDark: boolean) {
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  logout() {
    this.closeProfileModal();
    this.auth.logout();
  }
}
