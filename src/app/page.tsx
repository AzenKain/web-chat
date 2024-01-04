"use client"
import styles from './page.module.css';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { FileUploadDto } from '@/lib/dto';
import { updateAccessTokenAsync, getAllRoomchatAsync, getUserDataAsync, uploadFile, getRoomchatAsync, removeMessageAsync } from '@/lib';
import { Button, Card, Row, Col, Image, FormControl, InputGroup } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';
import { AiOutlineClose } from "react-icons/ai";
import { AiFillFileAdd } from "react-icons/ai";
import { Socket, io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { DefaultEventsMap } from '@socket.io/component-emitter';
type UserType = {
  [key: string]: string;
};

interface FileResponse {
  id: string;
  url: string;
  userId: string;
};

type MySocket = Socket<DefaultEventsMap, DefaultEventsMap>

export default function Home() {

  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [roomchatId, setRoomchatId] = useState('');
  const [userName, setUserName] = useState('');
  const [jwtAccess, setJwtAccess] = useState('');
  const [roomchat, setRoomchat] = useState<JSX.Element[]>([]);
  const [messages, setMessages] = useState<JSX.Element[]>([]);
  const [memberName, setMemberName] = useState<UserType>({});
  const [socket, setSocket] = useState<MySocket | undefined>(undefined);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };
  const handleDeleteItem = async (id: string) => {
    const accessToken: any = getCookie('jwt-access');
    const userIdTmp: any = getCookie('user-id');
    const roomIdTmp: any = getCookie('room-id');
    await removeMessageAsync(userIdTmp, roomIdTmp, id, accessToken)
  }

  const handleItemClick = async (idRoom: string) => {
    if (idRoom == roomchatId) return;
    setRoomchatId(idRoom);
    setCookie('room-id', idRoom);
    const accessToken: any = getCookie('jwt-access');
    const userIdTmp: any = getCookie('user-id');
    const dataRoomchatSingle: any = await getRoomchatAsync(idRoom, accessToken)

    const userName: UserType = {};
    for (let id of dataRoomchatSingle.member) {
      const dataUser: any = await getUserDataAsync(id, accessToken);
      userName[`${dataUser.id}`] = `${dataUser.detail.name}`
    }
    const message = [];
    for (let msg of dataRoomchatSingle.data) {

      if (msg.isDisplay == false) continue;
      let pos = "left";

      let buttonOption = []
      if (msg.userId === userIdTmp) {
        pos = "right";
        buttonOption.push(
          <Row>
            <Button variant="danger" id="button-addon2" style={{ color: '#fff' }} onClick={()=>handleDeleteItem(msg.id)}>x</Button>
          </Row>
        )
      }

      const messageClass = pos === 'right' ? styles['message-right'] : styles['message-left'];
      let fileStack = [];

      for (let tmpFile of msg.fileUrl) {
        fileStack.push(
          <Row className={`${messageClass}`}>
            <Image style={{ width: "50%", textAlign: pos === 'right' ? 'right' : 'left' }} src={tmpFile} alt="fileUpload" />
          </Row>
        );
      }

      message.push(
        <div className={styles['megs-container']}>
          <Row key={msg.id}>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <div className={styles.circularImage}>
                  <Image src="user.jpg" alt="User" roundedCircle />
                </div>
              </Col>
              <Col md="auto">
                <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginBottom: '5px', marginTop: '5px', fontSize: '2.5vh' }}>{userName[msg.userId]}</p>
              </Col>
            </Row>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <Row>
                  {fileStack}
                </Row>
                <Row>
                  <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginTop: '5px', fontSize: '2vh' }}>{msg.content}</p>
                </Row>
              </Col>
              <Row style={{ width: "15%", height: "15%" }}>
                {buttonOption}
              </Row>
            </Row>
          </Row>
        </div>
      );

    }
    setMessages(message);
    setMemberName(userName)
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
    const dataOwner: any = await getUserDataAsync(userIdTmp, data?.accessToken)
    setUserName(dataOwner.detail.name)
    const dataRoomchat: any = await getAllRoomchatAsync(userIdTmp, data?.accessToken);
    if (dataRoomchat) { setHasFetchedData(true) }
    const items = [];
    const message = [];
    for (let item in dataRoomchat) {
      if (dataRoomchat[item].isSingle == true) {
        const userContact = dataRoomchat[item].member.filter(item => item !== userIdTmp)[0];
        const dataUserContact = await getUserDataAsync(userContact, data?.accessToken);
        if (dataUserContact == null) continue;
        items.push(
          <Row key={dataRoomchat[item].id}>
            <Col className={`mb-4 ${styles.ContainerChatList}`}>
              <div
                className={`d-flex align-items-center ${styles.userContainer}`}
                onClick={() => handleItemClick(dataRoomchat[item].id)}
              >
                <div className={styles.circularImage}>
                  <Image src="user.jpg" alt="Roomchat" roundedCircle />
                </div>
                <div className={styles.userName}>{dataUserContact.detail.name}</div>
              </div>
            </Col>
          </Row>
        );
      }
      else {
        items.push(
          <Row key={dataRoomchat[item].id}>
            <Col className={`mb-4 ${styles.ContainerChatList}`}>
              <div
                className={`d-flex align-items-center ${styles.userContainer}`}
                onClick={() => handleItemClick(dataRoomchat[item].id)}
              >
                <div className={styles.circularImage}>
                  <Image src="roomchat.jpg" alt="Roomchat" roundedCircle />
                </div>
                <div className={styles.userName}>{dataRoomchat[item].title}</div>
              </div>
            </Col>
          </Row>
        );
      }
    }
    if (dataRoomchat.length == 0) return;
    const dataRoomchatSingle: any = await getRoomchatAsync(dataRoomchat[0].id, data?.accessToken)
    const userName: UserType = {};
    for (let id of dataRoomchatSingle.member) {
      const dataUser = await getUserDataAsync(id, data?.accessToken);
      if (dataUser == null) continue;
      userName[`${dataUser.id}`] = `${dataUser.detail.name}`
    }

    for (let msg of dataRoomchatSingle?.data) {

      if (msg.isDisplay == false) continue;
      let pos = "left";
      let buttonOption = []
      if (msg.userId === userIdTmp) {
        pos = "right";
        buttonOption.push(
          <Row>
            <Button variant="danger" id="button-addon2" style={{ color: '#fff' }} onClick={()=>handleDeleteItem(msg.id)}>x</Button>
          </Row>
        )
      }

      const messageClass = pos === 'right' ? styles['message-right'] : styles['message-left'];
      let fileStack = [];
      for (let tmpFile of msg.fileUrl) {
        fileStack.push(
          <Row className={`${messageClass}`}>
            <Image style={{ width: "50%", textAlign: pos === 'right' ? 'right' : 'left' }} src={tmpFile} alt="fileUpload" />
          </Row>
        );
      }
      message.push(
        <div className={styles['megs-container']}>
          <Row key={msg.id}>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <div className={styles.circularImage}>
                  <Image src="user.jpg" alt="User" roundedCircle />
                </div>
              </Col>
              <Col md="auto">
                <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginBottom: '5px', marginTop: '5px', fontSize: '2.5vh' }}>{userName[msg.userId]}</p>
              </Col>
            </Row>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <Row>
                  {fileStack}
                </Row>
                <Row>
                  <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginTop: '5px', fontSize: '2vh' }}>{msg.content}</p>
                </Row>
              </Col>
              <Row style={{ width: "15%", height: "15%" }}>
                {buttonOption}
              </Row>
            </Row>
          </Row>
        </div>
      );

    }
    setCookie('room-id', dataRoomchatSingle.id);
    setMemberName(userName)
    setRoomchat(items);
    setMessages([...message]);
    setRoomchatId(dataRoomchatSingle.id);
  }

  useEffect(() => {
    if (!hasFetchedData) {
      checkAuthentication();
    }
  }, []);

  useEffect(() => {
    const accessToken: any = getCookie('jwt-access');
    const userIdTmp: any = getCookie('user-id');
    const socket = io("http://103.144.87.14:3434", {
      transportOptions: {
        polling: {
          extraHeaders: { Authorization: `Bearer ${accessToken}` }
        }
      }
    })

    setSocket(socket);
    socket.on('newMessage', (msg: any) => {
      if (msg.isDisplay == false) return;
      const roomIdTmp = getCookie('room-id');
      if (msg.roomId != roomIdTmp) return;
      let pos = "left";
      let buttonOption = []
      if (msg.userId === userIdTmp) {
        pos = "right";
        buttonOption.push(
          <Row>
            <Button variant="danger" id="button-addon2" style={{ color: '#fff' }} onClick={()=>handleDeleteItem(msg.id)}>x</Button>
          </Row>
        )
      }

      const messageClass = pos === 'right' ? styles['message-right'] : styles['message-left'];
      let fileStack = [];
      for (let tmpFile of msg.fileUrl) {
        fileStack.push(
          <Row className={`${messageClass}`}>
            <Image style={{ width: "50%", textAlign: pos === 'right' ? 'right' : 'left' }} src={tmpFile} alt="fileUpload" />
          </Row>
        );
      }

      const newMessages = (
        <div className={styles['megs-container']}>
          <Row key={msg.id}>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <div className={styles.circularImage}>
                  <Image src="user.jpg" alt="User" roundedCircle />
                </div>
              </Col>
              <Col md="auto">
                <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginBottom: '5px', marginTop: '5px', fontSize: '2.5vh' }}>{memberName[msg.userId]}</p>
              </Col>
            </Row>
            <Row className={`${messageClass}`}>
              <Col md="auto">
                <Row>
                  {fileStack}
                </Row>
                <Row>
                  <p style={{ color: "#fff", textAlign: pos === 'right' ? 'right' : 'left', marginTop: '5px', fontSize: '2vh' }}>{msg.content}</p>
                </Row>
              </Col>
              <Row style={{ width: "15%", height: "15%" }}>
                {buttonOption}
              </Row>
            </Row>
          </Row>
        </div>
      );
      setMessages((prevMessages) => [...prevMessages, newMessages]);
      scrollToBottom();
    });

    socket.on('removeMessage', async (msg: any) => {
      const roomIdTmp: any = getCookie('room-id');
      setMessages((preMgs) => preMgs.filter(message => message.key !== msg.id));
      await handleItemClick(roomIdTmp)
    })

    socket.on('newFriend', async (friend: any) => {
      const dataUser = await getUserDataAsync(friend.createdUserId, accessToken)
      toast.info(`${dataUser.detail.name} đã gửi lời kết bạn!`)
    })

    socket.on('friendAccept', async (friend: any) => {
      const dataUser = await getUserDataAsync(friend.receiveUserId, accessToken)
      toast.info(`${dataUser.detail.name} đã đồng ý kết bạn!`)
    })

    socket.on('newRoomCreated', async (roomchats: any) => {
      if (roomchats.isSingle == true) {
        const userContact = roomchats.member.filter(item => item !== userIdTmp)[0];
        const dataUserContact = await getUserDataAsync(userContact, accessToken);
        const newRoom = (
          <Row key={roomchats.id}>
            <Col className={`mb-4 ${styles.ContainerChatList}`}>
              <div
                className={`d-flex align-items-center ${styles.userContainer}`}
                onClick={() => handleItemClick(roomchats.id)}
              >
                <div className={styles.circularImage}>
                  <Image src="user.jpg" alt="Roomchat" roundedCircle />
                </div>
                <div className={styles.userName}>{dataUserContact.detail.name}</div>
              </div>
            </Col>
          </Row>
        );
        setRoomchat((preRoom) => [...preRoom, newRoom]);
      }
      else {
        const newRoom = (
          <Row key={roomchats.id}>
            <Col className={`mb-4 ${styles.ContainerChatList}`}>
              <div
                className={`d-flex align-items-center ${styles.userContainer}`}
                onClick={() => handleItemClick(roomchats.id)}
              >
                <div className={styles.circularImage}>
                  <Image src="roomchat.jpg" alt="Roomchat" roundedCircle />
                </div>
                <div className={styles.userName}>{roomchats.title}</div>
              </div>
            </Col>
          </Row>
        )
        setRoomchat((preRoom) => [...preRoom, newRoom]);
      }

    })
    return () => {
      if (socket != undefined) {
        socket.disconnect()
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (socket == undefined) return;

    const newFile: FileResponse = {
      id: "-1",
      url: "",
      userId: "",
    }

    if (file != null) {
      const fileUpload = new FileUploadDto(userId, file)
      const accessToken = getCookie('jwt-access');
      if (accessToken) {
        const dataRe = await uploadFile(fileUpload, accessToken)
        newFile.id = dataRe.id;
        newFile.url = dataRe.url;
        newFile.userId = dataRe.userId;
      }
      setFile(null);
    }
    if (newFile.id != "-1")
      socket.emit("sendMessage", { userId: userId, content: message, fileUrl: [newFile.url], roomchatId: roomchatId })
    else
      socket.emit("sendMessage", { userId: userId, content: message, fileUrl: [], roomchatId: roomchatId })
    console.log('Sent message:', message);

    setMessage('');
  };

  const handleClearImage = () => {
    setFilePreview(null);
    setFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files[0];
    console.log('Selected file:', selectedFile);
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string); // Assuming file preview is a string
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <main>
      <div className={styles.main}>
        <p>{`Trang chủ của ${userName}`}</p>
        <Row>
          <Col sm={4} style={{ marginBottom: '20px', overflow: 'auto', height: "400px" }}>
            {roomchat.map((roomchat, index) => (
              <div key={index}>
                {roomchat}
              </div>
            ))}
          </Col>
          <Col sm={8}>
            <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
              <div>
                <div
                  ref={messagesEndRef}
                  style={{
                    marginBottom: '20px',
                    minHeight: '400px',
                    borderLeft: '1px solid #ccc',
                    padding: '20px',
                    overflow: 'auto',
                    height: '400px',
                    position: 'sticky',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {messages.map((message, index) => (
                      <div key={index}>{message}</div>
                    ))}
                  </div>
                </div>
                <InputGroup className="mb-3">
                  <div className={styles['buttonInput']}>
                    <input type="file" id='file' onChange={handleFileChange} accept='image/*' />
                    <label htmlFor="file">
                      <h2 style={{ color: '#fff' }}><AiFillFileAdd /></h2>
                    </label>
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
              {filePreview && (
                <div>
                  <h3 style={{ color: '#fff' }}>Preview:</h3>
                  <img src={filePreview} alt="Selected" width="200" />
                  <button onClick={handleClearImage}>Clear</button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </main>
  );
}
