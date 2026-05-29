import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser ?? await auth.authReady;

    if (user) {
        return true;
    }

    return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
    });
};

export const authChildGuard: CanActivateChildFn = (route, state) => authGuard(route, state);
