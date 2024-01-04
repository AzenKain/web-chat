"use client"
import styles from '../page.module.css';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { updateAccessTokenAsync, getUserDataAsync, getFriendRequestAsync, acceptFriendAsync, removeFriendAsync, createRoomchatAsync } from '@/lib';
import { RoomchatDto } from '@/lib/dto';
import { Button, Card, Row, Col, Image, FormControl, InputGroup } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
type ButtonType = {
    [key: string]: string;
  };

type MySocket = Socket<DefaultEventsMap, DefaultEventsMap>

export default function Friends() {
    const [friends, setFriends] = useState([])
    const [users, setUsers] = useState<JSX.Element[]>([])
    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [countRe, setCountRe] = useState<number>(0);
    const [socket, setSocket] = useState<MySocket | undefined>(undefined);
    const router = useRouter();
    const [buttonStates, setButtonStates] = useState<ButtonType>({});

    const handleFriendRequest = async (friendId: string) => {
        const accessToken : any = getCookie('jwt-access');
        const userIdTmp : any = getCookie('user-id');

        if (buttonStates[friendId] === 'Kết bạn') {
            await acceptFriendAsync(userIdTmp, friendId, accessToken);
            const newRoom = new RoomchatDto(userIdTmp, [friendId], userIdTmp + friendId, true)
            const data = await createRoomchatAsync(newRoom, accessToken)
        }
        else if (buttonStates[friendId] === 'Hủy kết bạn' ) {
            await removeFriendAsync(userIdTmp, friendId, accessToken);
        }

        buttonStates[friendId] = buttonStates[friendId] === 'Kết bạn' ? 'Hủy kết bạn' : 'Kết bạn';
        setButtonStates(() => buttonStates);
        await updateData(true)
    };
    
    const updateData = async(validate: boolean)  => {
        const accessToken : any = getCookie('jwt-access');
        const userIdTmp : any = getCookie('user-id');
        const dataUser = await getUserDataAsync(userIdTmp, accessToken)
        setFriends(dataUser.friends)
        const items = []
        for (let item in dataUser.friends) {

            const dataFriend = await getUserDataAsync(dataUser.friends[item], accessToken);
            const nickName = []
            if (dataFriend.detail.nickName !== '') {
                nickName.push(
                    <div className={styles.userName}>Biệt Danh: {dataFriend.detail.nickName}</div>
                )
            }

            buttonStates[dataFriend.id] = 'Hủy kết bạn';

            items.push(
                <Row key={dataFriend.id} className={styles['center-container']}>
                    <Col className={`mb-4 ${styles.ContainerChatList}`}>
                        <div
                            className={`d-flex align-items-center ${styles.userContainer}`}
                        >
                            <div className={styles.circularImage}>
                                <Image src="user.jpg" alt="user" roundedCircle />
                            </div>
                            <div className={styles.userName}>Tên: {dataFriend.detail.name}</div>
                            {nickName}
                            <Button variant="info" onClick={() => handleFriendRequest(dataFriend.id)}>
                                <div key={dataFriend.id}>{buttonStates[dataFriend.id]}</div>
                            </Button>
                        </div>
                    </Col>
                </Row>
            );
        }
        const dataFriendRe = await getFriendRequestAsync(userIdTmp, accessToken)
        for (const friend of dataFriendRe) {
            if (friend.createdUserId != userIdTmp) {
                const dataFriend = await getUserDataAsync(friend.createdUserId, accessToken);
                const nickName = []
                if (dataFriend.detail.nickName !== '') {
                    nickName.push(
                        <div className={styles.userName}>Biệt Danh: {dataFriend.detail.nickName}</div>
                    )
                }

                buttonStates[dataFriend.id] = 'Kết bạn';

                items.push(
                    <Row key={dataFriend.id} className={styles['center-container']}>
                        <Col className={`mb-4 ${styles.ContainerChatList}`}>
                            <div
                                className={`d-flex align-items-center ${styles.userContainer}`}
                            >
                                <div className={styles.circularImage}>
                                    <Image src="user.jpg" alt="user" roundedCircle />
                                </div>
                                <div className={styles.userName}>Tên: {dataFriend.detail.name}</div>
                                {nickName}
                                <Button variant="info" onClick={() => handleFriendRequest(dataFriend.id)}>
                                    <div key={dataFriend.id}>{buttonStates[dataFriend.id]}</div>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                );
            }
            else {
                const dataFriend = await getUserDataAsync(friend.receiveUserId, accessToken);
                const nickName = []
                if (dataFriend.detail.nickName !== '') {
                    nickName.push(
                        <div className={styles.userName}>Biệt Danh: {dataFriend.detail.nickName}</div>
                    )
                }

                buttonStates[dataFriend.id] = 'Hủy kết bạn';

                items.push(
                    <Row key={dataFriend.id} className={styles['center-container']}>
                        <Col className={`mb-4 ${styles.ContainerChatList}`}>
                            <div
                                className={`d-flex align-items-center ${styles.userContainer}`}
                            >
                                <div className={styles.circularImage}>
                                    <Image src="user.jpg" alt="user" roundedCircle />
                                </div>
                                <div className={styles.userName}>Tên: {dataFriend.detail.name}</div>
                                {nickName}
                                <Button variant="info" onClick={() => handleFriendRequest(dataFriend.id)}>
                                    <div key={dataFriend.id}>{buttonStates[dataFriend.id]}</div>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                );
            }
        }

        setUsers(items)
        setHasFetchedData(true)
    }

    async function getData() {
        const refresh = getCookie('jwt-refresh');
        const userIdTmp = getCookie('user-id');

        if (!refresh || !userIdTmp) {
            deleteCookie('jwt-access');
            deleteCookie('user-id');
            deleteCookie('jwt-refresh');
            router.push(`/Login`);
            return;
        }

        const data : any = await updateAccessTokenAsync(userIdTmp, refresh);

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
        await updateData(false);
    }

    useEffect(() => {
        if (!hasFetchedData && countRe < 4) {
            getData();
            let tmp = countRe + 1;
            setCountRe(tmp);
        }

    });

    useEffect(() => {
        const userIdTmp : any = getCookie('user-id');
        const accessToken : any= getCookie('jwt-access');
        if (!accessToken) return
        const socket = io("http://103.144.87.14:3434", {
            transportOptions: {
                polling: {
                    extraHeaders: { Authorization: `Bearer ${accessToken}` }
                }
            }
        })

        setSocket(socket);

        socket.on('newFriend', async (friend : any) => {
            const dataUser = await getUserDataAsync(friend.createdUserId, accessToken)
            toast.info(`${dataUser.detail.name} đã gửi lời kết bạn!`)
            await updateData(true)
        })

        socket.on('friendAccept', async (friend : any) => {;
            const dataUser = await getUserDataAsync(friend.receiveUserId, accessToken)
            toast.info(`${dataUser.detail.name} đã đồng ý kết bạn!`)
            await updateData(true)
        })

        socket.on('removeFriend', async (friend : any) => {
            console.log(friend)
            await updateData(true)
        })
    

        return () => {
            if (socket != undefined) {
                socket.disconnect()
            }
        }
    }, []);

    return (
        <div className={styles.main}>
            <p>Friends</p>
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