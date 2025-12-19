// Role-specific badge styling
export const getRoleBadgeStyle = (roleName: string) => {
  const roleStyles: Record<string, string> = {
    superadmin: "bg-purple-600 text-white hover:bg-purple-700",
    coordinator: "bg-blue-600 text-white hover:bg-blue-700",
    admin: "bg-red-600 text-white hover:bg-red-700",
    finance: "bg-green-600 text-white hover:bg-green-700",
    picker: "bg-orange-500 text-white hover:bg-orange-600",
    outbound: "bg-cyan-500 text-white hover:bg-cyan-600",
    "qc-ribbon": "bg-indigo-500 text-white hover:bg-indigo-600",
    "qc-online": "bg-violet-500 text-white hover:bg-violet-600",
    "mb-ribbon": "bg-pink-500 text-white hover:bg-pink-600",
    "mb-online": "bg-rose-500 text-white hover:bg-rose-600",
    packing: "bg-amber-500 text-white hover:bg-amber-600",
    guest: "bg-gray-500 text-white hover:bg-gray-600",
  };

  return (
    roleStyles[roleName.toLowerCase()] ||
    "bg-gray-500 text-white hover:bg-gray-600"
  );
};
