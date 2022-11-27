import React from 'react';
import AudibleService, { User } from '../../services/AudibleService';
import { Menu, Col, Row } from 'antd';
import { HomeOutlined, ImportOutlined, UnorderedListOutlined, LoginOutlined, UserAddOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import Gravatar from 'react-gravatar';
import { FaDiscord } from 'react-icons/fa';

const Header = () => {
  const [me, setMe] = React.useState<User | null>(null);
  const location = useLocation();

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

  const getSelectedMenu = () => {
    if (location.pathname === '/') {
      return ['home'];
    } else if (location.pathname === '/series/import') {
      return ['import'];
    } else if (location.pathname.startsWith('/series')) {
      return ['series'];
    } else if (location.pathname === '/signin') {
      return ['signin'];
    } else if (location.pathname === '/signup') {
      return ['signup'];
    }
    return [''];
  };

  let menuItems = [
    { label: <Link to={'/'}>Home</Link>, key: 'home' },
    { label: <Link to={'/series/active'}>My AudioBooks</Link>, key: 'series' },
    { label: <Link to={'/series/import'}>Import my AudioBooks</Link>, key: 'import' },
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
  userMenu.push({
    label: (
      <a href={'https://discord.gg/NcezYAbA'} target="_blank" rel="noreferrer">
        <span role="img" className="anticon">
          <FaDiscord color="#7289da" size={16} />
        </span>
      </a>
    ),
    key: 'discord',
  });

  return (
    <Row>
      <Col flex="auto">
        <Menu mode="horizontal" theme="dark" defaultSelectedKeys={['home']} selectedKeys={getSelectedMenu()} items={menuItems} />
      </Col>
      <Col flex="250px">
        <Menu theme="dark" mode="horizontal" items={userMenu} selectedKeys={getSelectedMenu()} />
      </Col>
    </Row>
  );
};

export default Header;
