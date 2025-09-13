import { getUser, isSignedIn } from "@/echo";
import DadFlow from "./components/dad-flow";
import SignIn from "./components/signin";
import SignOut from "./components/signout";

export default async function Home() {
  const _isSignedIn = await isSignedIn();
  const user = await getUser();

  if (!_isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
        <h1 className="text-2xl font-bold">Dad Locator</h1>
        <SignOut />
      </div>

      <div className="w-full max-w-2xl mt-6">
        <DadFlow />
      </div>
    </div>
  );
}
