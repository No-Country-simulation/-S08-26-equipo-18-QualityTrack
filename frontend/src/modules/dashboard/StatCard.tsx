import type { IconType } from "react-icons";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Card } from "../../components/Card";

export interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: IconType;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconColor = "#2563EB",
  iconBg = "blue.50",
}: StatCardProps) {
  return (
    <Card p={4}>
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {label}
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color="gray.800" mt={1}>
            {value}
          </Text>
        </Box>
        <Flex
          w={11}
          h={11}
          align="center"
          justify="center"
          borderRadius="lg"
          bg={iconBg}
          flexShrink={0}
        >
          <Icon size={22} color={iconColor} />
        </Flex>
      </Flex>
      {hint && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {hint}
        </Text>
      )}
    </Card>
  );
}

export default StatCard;
