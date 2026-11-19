"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 


const SearchBar = () => {
  const [query, setQuery] = useState("");
  const router=useRouter();
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Search Query:", query);
    // You can now use `query` to trigger search logic, e.g., route, API call, etc.
    if(query)
    {
        router.push(`/list?name=${query}`)
    }
  };
  

  return (
    <form
      className="flex items-center justify-between gap-2 bg-gray-100 px-4 py-2 rounded-md shadow-sm flex-1"
      role="search"
     onSubmit={handleSearch}
    >
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 cursor-pointer bg-transparent outline-none text-sm"
        aria-label="Search"
      />
      <button type="submit" className="cursor-pointer p-1">
        <Image src="/search.png" alt="Search Icon" width={16} height={16} />
      </button>
    </form>
  );
};

export default SearchBar;
