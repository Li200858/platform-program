// 通用输入组件
import React from 'react';

const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label = '',
  error = '',
  disabled = false,
  required = false,
  className = '',
  style = {},
  ...props
}) => {
  const inputStyles = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: error ? '2px solid #e74c3c' : '2px solid #ecf0f1',
    fontSize: '14px',
    backgroundColor: disabled ? '#f8f9fa' : 'white',
    color: disabled ? '#6c757d' : '#2c3e50',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'border-color 0.3s ease',
    ...style
  };

  const labelStyles = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px'
  };

  const errorStyles = {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={className}
          style={{
            ...inputStyles,
            resize: 'vertical',
            minHeight: '100px',
            fontFamily: 'inherit'
          }}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={className}
          style={inputStyles}
          {...props}
        />
      )}
      
      {error && (
        <div style={errorStyles}>
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
