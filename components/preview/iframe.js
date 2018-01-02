import React, { Component, Fragment } from 'react';
import { window, document } from 'global';

import Menu, { MenuItem } from 'material-ui/Menu';
import { ListItemIcon, ListItemText } from 'material-ui/List';
import Typography from 'material-ui/Typography';

import MoreHorizIcon from 'material-ui-icons/MoreVert';
import ZoomInIcon from 'material-ui-icons/ZoomIn';
import ZoomOutIcon from 'material-ui-icons/ZoomOut';

class Toolbar extends Component {
  state = {
    menu: false,
    anchorEl: undefined,
  };
  menu = e => {
    this.setState({
      menu: !this.state.menu,
      anchorEl: e.target,
    });
  };

  render() {
    const { children, onZoomChange, menuItems } = this.props;
    const { menu, anchorEl } = this.state;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: 32,
          boxSizing: 'border-box',
          padding: 4,
          // borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          background: '#fff',
          zIndex: 2,
        }}
      >
        {children}
        <MoreHorizIcon onClick={e => this.menu(e)} />
        <Menu id="simple-menu" anchorEl={anchorEl} open={menu} onClose={this.menu}>
          {menuItems}
          <MenuItem>
            <ListItemIcon onClick={() => onZoomChange(-0.25)}>
              <ZoomInIcon />
            </ListItemIcon>
            <ListItemText inset primary="Zoom" />
            <ListItemIcon onClick={() => onZoomChange(0.25)}>
              <ZoomOutIcon style={{ marginRight: 0, marginLeft: 16 }} />
            </ListItemIcon>
          </MenuItem>
        </Menu>
      </div>
    );
  }
}

const zoomedIframeStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  border: '0 none',
  transformOrigin: 'top left',
  background: '#f4f4f4',
  backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
  backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',

  backgroundImage: `
    linear-gradient(rgba(0,0,0,0.05) 2px, transparent 2px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 2px, transparent 2px),
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
};

const PointerOverlay = () => (
  <span
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      background: 'rgba(255,255,255,0.05)',
    }}
  />
);

const X = ({ children, height, zoom, getRef }) => (
  <div
    ref={getRef}
    style={{
      position: 'relative',
      height: 32 + height / zoom,
      overflow: 'hidden',
      transition: 'height .15s ease-out',
    }}
  >
    {children}
  </div>
);

class Preview extends Component {
  state = {
    zoom: 1,
    height: 0,
  };

  componentDidMount() {
    this.postMessageListener = ({ source, data: { size } }) => {
      if (size && this.elements.iframe && this.elements.iframe.contentWindow === source) {
        this.setState({ height: size.height });
      }
    };

    if (this.props.publisher) {
      this.props.publisher.listen((command, ...args) => {
        if (command === 'zoom') {
          this.setState({ zoom: this.state.zoom + args[0] });
        }
      });
    }
    window.addEventListener('message', this.postMessageListener, false);
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.postMessageListener);
  }

  elements = {};

  registerPreview(element) {
    if (window && element) {
      this.elements = {
        container: element,
        iframe: element.querySelector('iframe'),
      };
    }
  }

  render() {
    const { id, isDragging, menuItems = [], absolute = true, toolbar = true } = this.props;
    const { zoom, height } = this.state;

    const zoomPercentage = `${100 * zoom}%`;

    const Wrapper = absolute ? Fragment : X;
    const toolbarHeight = toolbar ? 32 : 0;

    const style = {
      ...zoomedIframeStyle,
      width: zoomPercentage,
      height: zoomPercentage,
      transform: `scale(${1 / zoom})`,
    };
    return (
      <Wrapper getRef={element => this.registerPreview(element)} {...{ zoom, height }}>
        {isDragging ? <PointerOverlay /> : null}
        {toolbar ? (
          <Toolbar menuItems={menuItems} onZoomChange={val => this.setState({ zoom: zoom + val })}>
            <Typography type="body2" gutterBottom>
              ({parseFloat(100 / zoom).toFixed(0)}%)
            </Typography>
          </Toolbar>
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: toolbarHeight,
            height: `calc(100% - ${toolbarHeight}px)`,
          }}
        >
          <iframe src="/preview-1" style={style} title={id} />
        </div>
      </Wrapper>
    );
  }
}

export default Preview;
