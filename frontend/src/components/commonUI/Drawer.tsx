import Logo from "@/assets/Logo.svg";
import { FlashcardsService } from "@/client";
import {
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerRoot,
} from "@/components/ui/drawer";
import useAuth from "@/hooks/useAuth";
import { Image, List, Spinner, Text, VStack } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FiLogOut } from "react-icons/fi";
import { DefaultButton } from "./Button";
function getCollectionsQueryOptions() {
	return {
		queryFn: () => FlashcardsService.readCollections(),
		queryKey: ["collections"],
	};
}

function Drawer({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}) {
	const { logout } = useAuth();
	const queryClient = useQueryClient();
	const currentUser = queryClient.getQueryData<{ email: string }>([
		"currentUser",
	]);
	const { data, isLoading } = useQuery({
		...getCollectionsQueryOptions(),
		placeholderData: (prevData) => prevData,
	});
	const collections = data?.data ?? [];

	const handleNavigate = () => setIsOpen(false);

	const handleLogout = async () => {
		logout();
		setIsOpen(false);
	};

	return (
		<DrawerRoot
			open={isOpen}
			onOpenChange={(e) => setIsOpen(e.open)}
			placement="start"
		>
			<DrawerBackdrop />
			<DrawerContent rounded="none" maxW="280px" bg="bg.box">
				<DrawerHeader display="flex" justifyContent="center" padding=".5rem">
					<Link to="/" onClick={handleNavigate}>
						<Image width="3rem" src={Logo} alt="logo" />
					</Link>
				</DrawerHeader>
				<DrawerBody py={2} px={1}>
					<VStack align="stretch">
						{isLoading ? (
							<VStack py={4}>
								<Spinner />
							</VStack>
						) : (
							<List.Root>
								{collections.map((collection) => (
									<List.Item
										key={collection.id}
										display="flex"
										alignItems="center"
										px={3}
										py={2}
										borderRadius="lg"
										transition="all 0.4s"
										_hover={{ bg: "bg.100" }}
										_active={{ bg: "bg.100" }}
									>
										<Link
											to="/collections/$collectionId"
											params={{ collectionId: collection.id }}
											onClick={handleNavigate}
											style={{ width: "100%" }}
										>
											<Text fontSize="15px" color="fg.DEFAULT" truncate>
												{collection.name}
											</Text>
										</Link>
									</List.Item>
								))}
							</List.Root>
						)}
					</VStack>
				</DrawerBody>
				<DrawerFooter>
					<VStack width="100%" gap={2}>
						{currentUser?.email && (
							<Text fontSize="sm" color="fg.muted">
								Logged in as: {currentUser.email}
							</Text>
						)}
						<DefaultButton onClick={handleLogout} width="100%" color="white">
							<FiLogOut size={20} />
							Log out
						</DefaultButton>
					</VStack>
				</DrawerFooter>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
}

export default Drawer;
