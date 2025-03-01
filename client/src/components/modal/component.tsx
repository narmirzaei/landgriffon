import { useRef } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/solid';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, usePreventScroll, useModal, OverlayContainer } from '@react-aria/overlays';

import { CONTENT_CLASSES, OVERLAY_CLASSES } from './constants';

import type { ModalProps } from './types';

export const Modal: React.FC<ModalProps> = ({
  title,
  open,
  children,
  className,
  onDismiss,
  theme = 'default',
  dismissable = true,
  size = 'fit',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { overlayProps } = useOverlay(
    {
      isKeyboardDismissDisabled: !dismissable,
      isDismissable: dismissable,
      isOpen: open,
      onClose: onDismiss,
    },
    containerRef,
  );
  const { modalProps } = useModal();
  const { dialogProps } = useDialog({ 'aria-label': title }, containerRef);

  usePreventScroll({ isDisabled: !open });

  return (
    <AnimatePresence>
      {open && (
        <OverlayContainer>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
              transition: {
                delay: 0,
              },
            }}
            exit={{
              opacity: 0,
              transition: {
                delay: 0.125,
              },
            }}
            className={OVERLAY_CLASSES}
          >
            <FocusScope contain restoreFocus autoFocus>
              <div {...overlayProps} {...dialogProps} {...modalProps} ref={containerRef}>
                <motion.div
                  initial={{
                    opacity: 0,
                    y: '-60%',
                    x: '-50%',
                  }}
                  animate={{
                    opacity: 1,
                    y: '-50%',
                    x: '-50%',
                    transition: {
                      delay: 0.125,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: '-60%',
                    x: '-50%',
                    transition: {
                      delay: 0,
                    },
                  }}
                  className={classNames(
                    'max-h-[90%]',
                    { 'p-6': theme !== 'minimal' },
                    CONTENT_CLASSES[size],
                    className,
                  )}
                >
                  <div className="overflow-hidden rounded-md bg-white">
                    {dismissable && theme === 'default' && (
                      <div className="relative flex items-center mb-4">
                        <div className="text-lg font-medium">{title}</div>
                        <button
                          type="button"
                          onClick={onDismiss}
                          className="absolute flex items-center px-4 py-4 text-sm text-gray-300 rounded-md -right-4 -top-4 focus:text-black hover:text-black"
                        >
                          <XIcon className="w-6 h-6 text-gray-500" />
                        </button>
                      </div>
                    )}
                    {children}
                  </div>
                  {theme === 'minimal' && dismissable && (
                    <div
                      onClick={onDismiss}
                      className="absolute z-30 cursor-pointer right-0 top-4 translate-x-1/2 p-6 bg-white rounded-full"
                    >
                      <XIcon className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              </div>
            </FocusScope>
          </motion.div>
        </OverlayContainer>
      )}
    </AnimatePresence>
  );
};

export default Modal;
