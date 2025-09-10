
import type { ReactNode } from "react"
import Sidebar from "@/components/Sidebar";
//import SuggestedProducts from "./SuggestedProducts";

const BaseLayout = ({
	children,
}: {
	children: ReactNode;
	renderRightPanel?: boolean;
}) => {
	
	return (
		<div className='flex max-w-2xl lg:max-w-7xl mx-auto relative'>
			<Sidebar />

			<div className='w-full lg:w-3/5 flex flex-col border-r'>{children}</div>
			{/*renderRightPanel && <SuggestedProducts />*/}
		</div>
	);
};
export default BaseLayout;
