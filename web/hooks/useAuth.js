import { useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    setUser({ email });
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    login,
    logout,
  };
}
