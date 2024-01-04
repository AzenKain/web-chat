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
import { SignupAsync } from '@/lib';
import { SignUpDto } from '@/lib/dto';
import { setCookie} from 'cookies-next';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SignUp() {
    const router = useRouter()

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState(new Date()); 
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [name, setName] = useState(''); 

    function formatDate(date: Date): string {
      
        const day: number = date.getDate();
        const month: number = date.getMonth() + 1;
        const year: number = date.getFullYear();
      
        return `${(day < 10 ? '0' : '')}${day}-${(month < 10 ? '0' : '')}${month}-${year}`;
      }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log(formatDate(birthday))
        const dto = new SignUpDto(email, password, name, birthday );
        if (parseFloat(phoneNumber) > 0) dto.phoneNumber = parseFloat(phoneNumber);
        const data = await SignupAsync(dto);
        if (!data) {
            console.log(data);
            toast.error("Error")
        }
        else {
            console.log(data);
            setCookie('jwt-refresh', data.refreshToken);
            setCookie('jwt-access', data.accessToken);
            setCookie('user-id', data.id);
            router.push('/')
        }
    };

    return (
        <main>
            <Row className={styles.main}>
                <p>SignUp</p>
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

                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                            placeholder="Username" 
                            onChange={event => setName(event.target.value)}
                            value={name}
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
                    <div className="mb-3"> 
                        <p>GeeksforGeeks - DatePicker</p> 
                        <DatePicker selected={birthday} onChange= 
                                {(date) => setBirthday(date)} /> 
                    </div>
                    <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control 
                            placeholder="Phone Number" 
                            onChange={event => setPhoneNumber(event.target.value)}
                            value={phoneNumber}
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
