import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      '[useAuth] must be used inside <AuthProvider>. ' +
      'Wrap your component tree with <AuthProvider> in App.jsx.'
    );
  }

  return ctx;
};

export default useAuth;
export { useAuth }; 