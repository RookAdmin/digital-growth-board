
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { getSecurityHeaders, auditLog } from '@/utils/security';

interface SecurityContextType {
  reportSecurityEvent: (event: string, details?: Record<string, any>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Set up security headers (meta tags for CSP)
    const headers = getSecurityHeaders();
    
    // Add CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = headers['Content-Security-Policy'];
    document.head.appendChild(cspMeta);

    // Add other security meta tags
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.httpEquiv = 'X-Frame-Options';
    frameOptionsMeta.content = headers['X-Frame-Options'];
    document.head.appendChild(frameOptionsMeta);

    // Monitor for suspicious activity
    const handleRightClick = (e: MouseEvent) => {
      // Log right-click events for monitoring
      auditLog('RIGHT_CLICK_DETECTED', undefined, {
        target: (e.target as Element)?.tagName,
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Monitor for developer tools shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'u' || e.key === 'i' || e.key === 'j' || e.key === 's')
      ) {
        auditLog('DEV_TOOLS_SHORTCUT_DETECTED', undefined, {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey
        });
      }
    };

    const handleDevToolsOpen = () => {
      auditLog('DEV_TOOLS_OPENED', undefined, {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
    };

    // Detect developer tools
    let devtools = { open: false };
    const threshold = 160;
    
    const detectDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          handleDevToolsOpen();
        }
      } else {
        devtools.open = false;
      }
    };

    const interval = setInterval(detectDevTools, 500);

    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('keydown', handleKeyDown);

    // Monitor for tampering attempts
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      auditLog('CONSOLE_ACCESS', undefined, { args: args.slice(0, 3) });
      originalConsoleLog.apply(console, args);
    };

    return () => {
      clearInterval(interval);
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('keydown', handleKeyDown);
      console.log = originalConsoleLog;
    };
  }, []);

  const reportSecurityEvent = (event: string, details?: Record<string, any>) => {
    auditLog(`SECURITY_EVENT_${event}`, undefined, details);
  };

  return (
    <SecurityContext.Provider value={{ reportSecurityEvent }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
