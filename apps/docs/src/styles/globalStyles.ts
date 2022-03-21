import { globalCss } from '@nextui-org/react';

export default globalCss({
  // sandpack-react
  '.sp-highlight': {
    background: '$codeHighlight'
  },
  '.sp-tabs': {
    border: 'none !important',
    borderRadius: 'inherit',
    button: {
      cursor: 'pointer'
    }
  },
  '.sp-layout': {
    border: 'none !important',
    overflow: 'visible !important',
    WebkitMaskImage: 'none !important',
    background: 'transparent !important'
  },
  '.sp-pre-placeholder': {
    background: 'transparent !important',
    borderRadius: '0 !important'
  }
});
