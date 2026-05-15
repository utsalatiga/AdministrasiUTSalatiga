export const isAdmin = (role: string | undefined | null) => {
  return role === 'admin' || role === 'super_admin';
};

export const isSuperAdmin = (role: string | undefined | null) => {
  return role === 'super_admin';
};
