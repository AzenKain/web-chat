'use client';
import { NavLink } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import style from '../app/styles/header.module.css';

function Header() {
  return (
    <header className={style['header_base']}>
      <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="bg-body-tertiary" fixed="top">
        <Container>
          <img src='/icon.jpg' alt="HTML5 Icon" width="30" height="30"/>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Trang chủ</Nav.Link>
              <Nav.Link href="/admin">Quản trị</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>

  );
}

export default Header;