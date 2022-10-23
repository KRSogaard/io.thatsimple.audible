import React from 'react';
import AudibleService, { User } from '../services/AudibleService';
import { Menu, Col, Row } from 'antd';
import { HomeOutlined, ImportOutlined, UnorderedListOutlined, LoginOutlined, UserAddOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Gravatar from 'react-gravatar';

const Header = () => {
  const [me, setMe] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (AudibleService.isAuthenticated()) {
      setMe(AudibleService.getMe());
    }
  }, []);

  const handleLogout = (e: any) => {
    e.preventDefault();
    AudibleService.logout();
    window.location.href = '/';
  };

  let menuItems = [
    { label: <Link to={'/'}>Home</Link>, key: 'home' },
    { label: <Link to={'/series'}>My AudioBooks</Link>, key: 'series' },
    { label: <Link to={'/import'}>Import my AudioBooks</Link>, key: 'import' },
  ];

  let userMenu = [];
  if (!AudibleService.isAuthenticated()) {
    userMenu.push({ label: <Link to={'/signin'}>Sign In</Link>, key: 'signin' });
    userMenu.push({ label: <Link to={'/signup'}>Sign Up</Link>, key: 'signup' });
  } else {
    userMenu.push({
      label: (
        <Row>
          <Col flex="6">{me && <Gravatar email={me.email} rating="pg" default={'retro'} />}</Col>
          <Col style={{ paddingLeft: '5px' }} flex="auto">
            {me?.username}
          </Col>
        </Row>
      ),
      key: 'submenu',
      children: [
        {
          label: (
            <Link onClick={handleLogout} to={'/signout'}>
              Sign out
            </Link>
          ),
          key: 'sign-out',
        },
      ],
    });
  }

  return (
    <Row>
      <Col flex="auto">
        <Menu mode="horizontal" theme="dark" defaultSelectedKeys={['home']} items={menuItems} />
      </Col>
      <Col flex="250px">
        <Menu theme="dark" mode="horizontal" items={userMenu} />
      </Col>
    </Row>
  );
};

export default Header;
