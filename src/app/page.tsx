"use client"
import styles from './page.module.css';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { updateAccessTokenAsync, getAllRoomchatAsync, getUserDataAsync } from '@/lib';
import { Button, Card, Row, Col, Image, FormControl, InputGroup } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';
import { io } from 'socket.io-client';

type UserType = {
  [key: string]: string;
};

export default function Home() {

  const router = useRouter();
  const [countRe, setCountRe] = useState<number>(0);
  const [userId, setUserId] = useState('');
  const [roomchatId, setRoomchatId] = useState('');
  const [jwtAccess, setJwtAccess] = useState('');
  const [roomchat, setRoomchat] = useState<JSX.Element[]>([]);
  const [messages, setMessages] = useState<JSX.Element[]>([]);
  const [memberName, setMemberName] = useState<UserType>({});
  const [socket, setSocket] = useState(undefined);
  const [hasFetchedData, setHasFetchedData] = useState(false);

  const handleItemClick = async (id: string) => {
    setRoomchatId(id);
    console.log(id)
    console.log('handleItemClick');
  };
  const checkAuthentication = async () => {
    const refresh = getCookie('jwt-refresh');
    const userIdTmp = getCookie('user-id');

    if (!refresh || !userIdTmp) {
      deleteCookie('jwt-access');
      deleteCookie('user-id');
      deleteCookie('jwt-refresh');
      router.push(`/Login`);
      return;
    }

    const data = await updateAccessTokenAsync(userIdTmp, refresh);
    if (!data) {
      deleteCookie('jwt-access');
      deleteCookie('user-id');
      deleteCookie('jwt-refresh');
      router.push(`/Login`);
    } else {
      setCookie('jwt-refresh', data.refreshToken);
      setCookie('jwt-access', data.accessToken);
      setCookie('user-id', data.id);
      setUserId(data.id);
      setJwtAccess(data.accessToken);
    }

    const dataRoomchat = await getAllRoomchatAsync(userIdTmp, data.accessToken);
    if (dataRoomchat) { setHasFetchedData(true) }
    const items = [];
    const message = [];
    for (let item in dataRoomchat) {
      items.push(
        <Row key={dataRoomchat[item].id}>
          <Col className={`mb-4 ${styles.ContainerChatList}`}>
            <div
              className={`d-flex align-items-center ${styles.userContainer}`}
              onClick={() => handleItemClick(dataRoomchat[item].id)}
            >
              <div className={styles.circularImage}>
                <Image src="class.jpg" alt="User" roundedCircle />
              </div>
              <div className={styles.userName}>{dataRoomchat[item].title}</div>
            </div>
          </Col>
        </Row>
      );


    }

    const userName : UserType = {}
    for (let id of dataRoomchat[0].member) {
        const dataUser = await getUserDataAsync(id, data.accessToken);
        userName[`${dataUser.id}`] =`${dataUser.detail.name}`
    }

    for (let msg of dataRoomchat[0].data) {

      if (msg.isDisplay == false) continue;

      message.push(
        <Row>
          <Col>
            <p style={{ color: "#fff" }}>{userName[msg.userId]} : {msg.content}</p>
          </Col>
        </Row>
      )
    }
    setMemberName(userName)
    setRoomchat(items);
    setMessages(message);
    setRoomchatId(dataRoomchat[0].id);
  }

  useEffect(() => {
    if (!hasFetchedData && countRe < 10) {
      checkAuthentication();
      let tmp = countRe + 1;
      setCountRe(tmp);
    }

    if (socket == undefined && jwtAccess != '') {
      const access = getCookie('jwt-access');
      const socketTmp = io("http://103.144.87.14:3434", {
        transportOptions: {
          polling: {
            extraHeaders: { Authorization: `Bearer ${access}` }
          }
        }
      })

      setSocket(socketTmp);
    }
  });

  useEffect(() => {
    if (socket != undefined) {
      socket.on('newMessage', (message) => {
        console.log(message);
        const newMessages = [...messages]; // Tạo một bản sao của mảng messages
        newMessages.push(
          <Row key={messages.length + 1}>
            <Col>
              <p style={{ color: "#fff" }}>{memberName[message.userId]} : {message.content}</p>
            </Col>
          </Row>
        );
        setMessages(newMessages);
      });
    }
  });
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const handleSendMessage = () => {
    socket.emit("sendMessage", { userId: userId, content: message, fileUrl: [], roomchatId: roomchatId })
    console.log('Sent message:', message);
    setMessage('');
  };

  const handleFileChange = (event) => {
    // Code to handle file selection
    const selectedFile = event.target.files[0];
    console.log('Selected file:', selectedFile);
    setFile(selectedFile);
  };
  return (
    <main>
      <div className={styles.main}>
        <p>Trang Chủ</p>
        <Row>
          <Col sm={4}>
            {roomchat}
          </Col>
          <Col sm={8}>
            <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
              <div>
                <div style={{ marginBottom: '20px', minHeight: '400px', borderLeft: '1px solid #ccc', padding: '20px' }}>
                  {messages.map((message, index) => (
                    <div key={index}>
                      {message} {/* Đảm bảo các phần tử có key duy nhất */}
                    </div>
                  ))}
                </div>
                <InputGroup className="mb-3">
                  <div style={{ alignItems: 'left', width: "100%" }}>
                    <input type="file" onChange={handleFileChange} >
                    </input>
                    {file && <p>Selected File: {file.name}</p>}
                  </div>
                  <FormControl
                    placeholder="Type your message here..."
                    aria-label="Type your message here"
                    aria-describedby="basic-addon2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button variant="outline-secondary" id="button-addon2" onClick={handleSendMessage}>
                    <h2 style={{ color: '#fff' }}><IoMdSend /></h2>
                  </Button>
                </InputGroup>
              </div>

            </div>
          </Col>
        </Row>
      </div>
    </main>
  );
}
