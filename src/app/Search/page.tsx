"use client"
import styles from '../page.module.css';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { updateAccessTokenAsync, getUserDataAsync, findFriendAsync, addFriendAsync, removeFriendAsync } from '@/lib';
import { Button, Card, Row, Col, Image, FormControl, InputGroup } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';
import { Socket, io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { DefaultEventsMap } from '@socket.io/component-emitter';
type ButtonType = {
    [key: string]: string;
  };
type MySocket = Socket<DefaultEventsMap, DefaultEventsMap>
export default function Search() {
    const [content, setContent] = useState("")
    const [currentNoti, setCurrentNoti] = useState({})
    const [friends, setFriends] = useState([])
    const [users, setUsers] = useState<JSX.Element[]>([])
    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [socket, setSocket] = useState<MySocket | undefined>(undefined);
    const [buttonStates, setButtonStates] = useState<ButtonType>({});
    const router = useRouter();

    const handleFriendRequest = async (friendId : string) => {
        const accessToken : any = getCookie('jwt-access');
        const userIdTmp : any  = getCookie('user-id');

        if (buttonStates[friendId] === 'Kết bạn') {
            const data = await addFriendAsync(userIdTmp, friendId, accessToken);
            console.log(data);
        }

        else if (buttonStates[friendId] === 'Hủy kết bạn' ) {
            const data = await removeFriendAsync(userIdTmp, friendId, accessToken);
            console.log(data);
        }

        buttonStates[friendId] = buttonStates[friendId] === 'Kết bạn' ? 'Hủy kết bạn' : 'Kết bạn';
        setButtonStates(buttonStates);
        await handleSearch(true)

    };


    const handleSearch = async ( validate: boolean) => {
        const accessToken : any = getCookie('jwt-access');
        const userIdTmp : any = getCookie('user-id');
        const data : any = await findFriendAsync(content, accessToken)
        const items = []
        for (let item in data) {
            if (data[item].id === userIdTmp) continue;
            const nickName = []
            if (data[item].detail.nickName !== '') {
                nickName.push(
                    <div className={styles.userName}>Biệt Danh: {data[item].detail.nickName}</div>
                )
            }

            if (!validate) {
                buttonStates[data[item].id] = 'Kết bạn';

                if (friends.indexOf(data[item].id) != -1) {
                    buttonStates[data[item].id] = 'Hủy kết bạn';
                }
            }

            setButtonStates(buttonStates);
            items.push(
                <Row key={data[item].id} className={styles['center-container']}>
                    <Col className={`mb-4 ${styles.ContainerChatList}`}>
                        <div
                            className={`d-flex align-items-center ${styles.userContainer}`}
                        >
                            <div className={styles.circularImage}>
                                <Image src="user.jpg" alt="user" roundedCircle />
                            </div>
                            <div className={styles.userName}>Tên: {data[item].detail.name}</div>
                            {nickName}
                            <Button variant="info" onClick={() => handleFriendRequest(data[item].id)}>
                                <div key={data[item].id}>{buttonStates[data[item].id]}</div>
                            </Button>
                        </div>
                    </Col>
                </Row>
            );
        }
        setButtonStates(buttonStates);
        setUsers(items)
    }
    async function getData() {
        const refresh : any= getCookie('jwt-refresh');
        const userIdTmp : any = getCookie('user-id');

        if (!refresh || !userIdTmp) {
            deleteCookie('jwt-access');
            deleteCookie('user-id');
            deleteCookie('jwt-refresh');
            router.push(`/Login`);
            return;
        }

        const data : any= await updateAccessTokenAsync(userIdTmp, refresh);

        if (!data) {
            deleteCookie('jwt-access');
            deleteCookie('user-id');
            deleteCookie('jwt-refresh');
            router.push(`/Login`);
        } else {
            setCookie('jwt-refresh', data.refreshToken);
            setCookie('jwt-access', data.accessToken);
            setCookie('user-id', data.id);
        }
        const dataUser = await getUserDataAsync(data?.id, data?.accessToken)
        setFriends(dataUser.friends)
        setHasFetchedData(true)
    }
    useEffect(() => {
        if (!hasFetchedData) {
            getData();
        }

    }, []);
    
    useEffect(() => {
        if (socket == undefined) {
            const access = getCookie('jwt-access');
            if (!access) return
            const socketTmp = io("http://103.144.87.14:3434", {
                transportOptions: {
                    polling: {
                        extraHeaders: { Authorization: `Bearer ${access}` }
                    }
                }
            })
            setSocket(socketTmp);
        }

        if (socket != undefined) {
          const userIdTmp : any= getCookie('user-id');
          const accessToken : any= getCookie('jwt-access');

          socket.on('newFriend', async (friend : any) => {
            const dataUser = await getUserDataAsync(friend.createdUserId, accessToken)
            toast.info(`${dataUser.detail.name} đã gửi lời kết bạn!`)
          })
          socket.on('friendAccept', async (friend : any) => {
            const dataUser = await getUserDataAsync(friend.receiveUserId, accessToken)
            toast.info(`${dataUser.detail.name} đã đồng ý kết bạn!`)
          })
        }
        return () => {
            if (socket != undefined) {
                socket.disconnect()
            }
        }
      }, []);
    return (
        <div className={styles.main}>
            <p>Search</p>
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Type your message here..."
                    aria-label="Type your message here"
                    aria-describedby="basic-addon2"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <Button variant="outline-secondary" onClick={() => handleSearch(false)}>
                    <h2 style={{ color: '#fff' }}><IoMdSend /></h2>
                </Button>
            </InputGroup>
            <Row style={{ marginBottom: '20px', overflow: 'auto', height: "400px" }}>
                {users.map((user, index) => (
                    <div key={index}>
                        {user}
                    </div>
                ))}
            </Row>
        </div>
    )
}