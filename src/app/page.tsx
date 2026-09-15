export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen text-3xl font-semibold tracking-tight font-inter">
      Hello,
      <span className="ml-2 text-blue-500 mask-radial-from-30% to-100%">
        Developer
      </span>
      !
      <p className="font-mono absolute top-10 left-10 text-base text-gray-700">
        Fable 5.1 was here
      </p>
    </div>
  );
}
