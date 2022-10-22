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

  return (
    <Row>
      <Col flex="auto">
        <Menu mode="horizontal" theme="dark" defaultSelectedKeys={['home']}>
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to={'/'}>Home</Link>
          </Menu.Item>
          <Menu.Item key="series" icon={<UnorderedListOutlined />}>
            <Link to={'/series'}>My AudioBooks</Link>
          </Menu.Item>
          <Menu.Item key="import" icon={<ImportOutlined />}>
            <Link to={'/import'}>Import my AudioBooks</Link>
          </Menu.Item>
        </Menu>
      </Col>
      <Col flex="250px">
        <Menu theme="dark" mode="horizontal">
          {!AudibleService.isAuthenticated() ? (
            <>
              <Menu.Item icon={<LoginOutlined />}>
                <Link to={'/signin'}>Sign in</Link>
              </Menu.Item>
              <Menu.Item icon={<UserAddOutlined />}>
                <Link to={'/signup'}>Sign up</Link>
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.SubMenu
                key="SubMenu"
                title={
                  <Row>
                    <Col flex="6">
                      <Gravatar email={me?.email} rating="pg" default={'retro'} />
                    </Col>
                    <Col style={{ paddingLeft: '5px' }} flex="auto">
                      {me?.username}
                    </Col>
                  </Row>
                }>
                <Menu.Item icon={<LogoutOutlined />}>
                  <Link onClick={handleLogout} to={'/signout'}>
                    Sign out
                  </Link>
                </Menu.Item>
              </Menu.SubMenu>
            </>
          )}
        </Menu>
      </Col>
    </Row>
  );
};

export default Header;
