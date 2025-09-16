import React, { createContext, useContext, useState } from 'react';

const MessageContext = createContext();

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const showMessage = (msg, msgType = 'info') => {
    setMessage(msg);
    setType(msgType);
  };

  const showSuccess = (msg) => showMessage(msg, 'success');
  const showError = (msg) => showMessage(msg, 'error');
  const showWarning = (msg) => showMessage(msg, 'warning');
  const showInfo = (msg) => showMessage(msg, 'info');

  const clearMessage = () => {
    setMessage('');
    setType('info');
  };

  return (
    <MessageContext.Provider value={{
      message,
      type,
      showMessage,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      clearMessage
    }}>
      {children}
    </MessageContext.Provider>
  );
};

