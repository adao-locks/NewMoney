import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
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

    async logout() {
        await signOut(firebaseAuth);
        await this.router.navigate(['/login']);
    }
}
