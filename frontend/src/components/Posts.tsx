import UnderlinedText from "./ui/UnderlinedText";
import Post from "./Post";
import PostSkeleton from "./ui/PostSkeleton";


const Posts = ({ isSubscribed, admin }: { isSubscribed: boolean; admin: String }) => {
    
	return (
		<div>
			{true &&
				[1,2,3,4,5]?.map((post,i) => <Post key={i} post={post} admin={admin} isSubscribed={isSubscribed} />)}

			{false && (
				<div className='mt-10 px-3 flex flex-col gap-10'>
					{[...Array(3)].map((_, i) => (
						<PostSkeleton key={i} />
					))}
				</div>
			)}

			{false && []?.length === 0 && (
				<div className='mt-10 px-3'>
					<div className='flex flex-col items-center space-y-3 w-full md:w-3/4 mx-auto '>
						<p className='text-xl font-semibold'>
							No Posts <UnderlinedText>Yet</UnderlinedText>
						</p>

						<p className='text-center'>
							Stay tuned for more posts from{" "}
							<span className='text-primary font-semibold text-xl'>OnlyHorse.</span> You can subscribe to
							access exclusive content when it's available.
						</p>
					</div>
				</div>
			)}
		</div>
	);
};
export default Posts;
