import { Text } from '@mantine/core';
import { IconImageInPicture } from '@tabler/icons-react';

export function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof IconImageInPicture;
  children: React.ReactNode;
}) {
  return <h2 className="section-title"><Icon size={15} stroke={1.8} /><span>{children}</span></h2>;
}

export function Helper({ children }: { children: React.ReactNode }) {
  return <Text className="helper" size="xs">{children}</Text>;
}
