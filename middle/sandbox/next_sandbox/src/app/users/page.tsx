import { fetchUsers } from "../utils/dataAPI";
import SmallUserCard from "@/components/shared/SmallUserCard";
import Counter from "@/components/shared/Counter";

export default async function UsersPage() {
  const users = await fetchUsers();
  return (
    <div className="flex flex-col gap-4">
      <Counter />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <SmallUserCard key={user.id} id={user.id} name={user.name} email={user.email} phone={user.phone} website={user.website} address={user.address.street} company={user.company.name} />
        ))}
      </div>
    </div>
  );
}