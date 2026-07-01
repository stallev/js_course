import Link from "next/link";

type SmallUserCardProps = {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  company: string;
};

export default function SmallUserCard({ id, name, email, phone, website, address, company }: SmallUserCardProps) {
  return <Link href={`/users/${id}`} className="flex flex-col gap-2 border border-gray-300 rounded-md p-4">
    <h2 className="text-lg font-bold">ID {id}</h2>
    <h2 className="text-lg font-bold">{name}</h2>
    <p className="text-sm text-gray-500">{email}</p>
    <p className="text-sm text-gray-500">{phone}</p>
    <p className="text-sm text-gray-500">{website}</p>
    <p className="text-sm text-gray-500">{address}</p>
    <p className="text-sm text-gray-500">{company}</p>
  </Link>;  
}