import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
    EmailAuthProvider,
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updatePassword,
    updateProfile,
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { firebaseAuth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly userSubject = new BehaviorSubject<User | null>(firebaseAuth.currentUser);
    readonly user$ = this.userSubject.asObservable();
    private authReadyResolver!: (user: User | null) => void;
    readonly authReady = new Promise<User | null>((resolve) => {
        this.authReadyResolver = resolve;
    });

    constructor(private router: Router) {
        onAuthStateChanged(firebaseAuth, (user) => {
            this.userSubject.next(user);
            this.authReadyResolver(user);
        });
    }

    get currentUser() {
        return this.userSubject.value;
    }

    async login(email: string, password: string) {
        return signInWithEmailAndPassword(firebaseAuth, email, password);
    }

    async register(email: string, password: string, displayName: string) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (displayName.trim()) {
            await updateProfile(credential.user, { displayName: displayName.trim() });
        }
        return credential;
    }

    async loginWithGoogle() {
        return signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    }

    async updateDisplayName(displayName: string) {
        const user = firebaseAuth.currentUser;
        if (!user) {
            throw new Error('Nenhum usuario autenticado.');
        }

        await updateProfile(user, { displayName: displayName.trim() });
        this.userSubject.next(firebaseAuth.currentUser);
    }

    async updatePassword(currentPassword: string, newPassword: string) {
        const user = firebaseAuth.currentUser;
        if (!user?.email) {
            throw new Error('Nenhum usuario com e-mail autenticado.');
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    }

    async logout() {
        await signOut(firebaseAuth);
        await this.router.navigate(['/login']);
    }
}
