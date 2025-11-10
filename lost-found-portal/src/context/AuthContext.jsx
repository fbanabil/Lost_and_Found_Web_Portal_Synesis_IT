import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { store } from '../utils/storage'


const KEY = 'lf_auth_v1'
const AuthCtx = createContext(null)


export function AuthProvider({ children }){
const [user, setUser] = useState(() => store.get(KEY, null))


useEffect(()=>{ store.set(KEY, user) }, [user])


const register = async ({ name, email, password, confirmPassword, phone }) => {
	if(password !== confirmPassword) throw new Error('Passwords do not match')

    const body = {
		Email: email,
		PersonName: name,
		PhoneNumber: phone || '',
		Password: password,
        ConfirmPassword : confirmPassword
	}

	const resp = await fetch('https://localhost:7238/Authentication/RegisterUser', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})

	if(!resp.ok){
		let parsed = null
		try{ parsed = await resp.json() }catch(e){ /* not JSON */ }
		try{ const cloneText = await resp.clone().text() }catch(_){}

		if(parsed){
			if(Array.isArray(parsed)){
				const msgs = parsed.map(err => err?.Description || err?.description || err?.Message || JSON.stringify(err)).join('; ')
				throw new Error(msgs || 'Registration failed')
			}

			if(parsed.Errors || parsed.errors){
				const list = parsed.Errors || parsed.errors
				const msgs = (Array.isArray(list) ? list : Object.values(list)).map(e => e?.Description || e?.description || e?.Message || JSON.stringify(e)).join('; ')
				throw new Error(msgs || 'Registration failed')
			}

	
			const msg = parsed?.message || parsed?.error || JSON.stringify(parsed)
			throw new Error(msg || 'Registration failed')
		}

		try{ const txt = await resp.text(); throw new Error(txt || 'Registration failed') }catch(_){ throw new Error('Registration failed') }
	}

	const data = await resp.json()
	const token = data?.token || data?.accessToken || null
	if(!token) throw new Error(data?.message || 'Invalid response from registration server')

	const auth = {
		id: data.userId || data.id || email, 
		name: data.personName || name,
		email,
		accessToken: token,
		refreshToken: null,
		expiresAt: data.expiresAt || null
	}

	setUser(auth)
}


const login = async ({ email, password }) => {
		const resp = await fetch('https://localhost:7238/Authentication/Login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userName: email, password })
		})

		if(!resp.ok){
			let errMsg = 'Login failed'
			try{
				const errBody = await resp.json()
				errMsg = errBody?.message || errBody?.error || errMsg
			}catch(e){
				try{ errMsg = await resp.text() }catch(_){}
			}
			throw new Error(errMsg)
		}

		const data = await resp.json()
		const token = data?.token || data?.accessToken || null
		if(!token) throw new Error(data?.message || 'Invalid response from authentication server')

		const auth = {
			id: data.userId || data.id || email, 
			name: data.personName || null,
			email,
			accessToken: token,
			refreshToken: null,
			expiresAt: data.expiresAt || null
		}

		setUser(auth)
}


const logout = () => setUser(null)


const value = useMemo(()=>({ user, register, login, logout }), [user])
return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}


export const useAuth = () => useContext(AuthCtx)