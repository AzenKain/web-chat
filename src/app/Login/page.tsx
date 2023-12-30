"use client";
import styles from '../styles/login.module.css'
import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { LoginAsync } from '@/lib';
import { LoginDto } from '@/lib/dto';
import { setCookie} from 'cookies-next';
export default function Login() {
    const router = useRouter()

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const dto = new LoginDto(email, password);
        const data = await LoginAsync(dto);
        if (!data) {
            console.log(data);
            toast.error("Error")
        }
        else {
            setCookie('jwt-refresh', data.refreshToken);
            setCookie('jwt-access', data.accessToken);
            setCookie('user-id', data.id);
            router.push('/')
        }
    };

    return (
        <main>
            <Row className={styles.main}>
                <p>Login</p>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control 
                            type="email" 
                            placeholder="Enter email" 
                            onChange={event => setEmail(event.target.value)}
                            value={email}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            onChange={event => setPassword(event.target.value)}
                            value={password}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Xác Nhận
                    </Button>
                </Form>
            </Row>
        </main>
    )
}
