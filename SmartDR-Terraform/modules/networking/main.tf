resource "aws_vpc" "primary" {
  provider = aws.primary
  cidr_block = var.primary_vpc_cidr
  
  tags = {
    Name        = "${var.project_name}-primary-vpc"
    Environment = var.environment
  }
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}


resource "aws_vpc" "secondary" {
  provider = aws.secondary
  cidr_block = var.secondary_vpc_cidr
  
  tags = {
    Name        = "${var.project_name}-secondary-vpc"
    Environment = var.environment
  }
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}


resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id = aws_vpc.primary.id
  
  tags = {
    Name        = "${var.project_name}-primary-igw"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id = aws_vpc.secondary.id
  
  tags = {
    Name        = "${var.project_name}-secondary-igw"
    Environment = var.environment
  }
}


resource "aws_subnet" "primary_public" {
  provider = aws.primary
  count = length(var.primary_public_subnet_cidrs)
  vpc_id = aws_vpc.primary.id
  cidr_block = var.primary_public_subnet_cidrs[count.index]
  availability_zone = var.primary_azs[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.project_name}-primary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}


resource "aws_subnet" "primary_private" {
  provider = aws.primary
  count = length(var.primary_private_subnet_cidrs)
  vpc_id = aws_vpc.primary.id
  cidr_block = var.primary_private_subnet_cidrs[count.index]
  availability_zone = var.primary_azs[count.index]
  
  tags = {
    Name        = "${var.project_name}-primary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}


resource "aws_subnet" "secondary_public" {
  provider = aws.secondary
  count = length(var.secondary_public_subnet_cidrs)
  vpc_id = aws_vpc.secondary.id
  cidr_block = var.secondary_public_subnet_cidrs[count.index]
  availability_zone = var.secondary_azs[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.project_name}-secondary-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}


resource "aws_subnet" "secondary_private" {
  provider = aws.secondary
  count = length(var.secondary_private_subnet_cidrs)
  vpc_id = aws_vpc.secondary.id
  cidr_block = var.secondary_private_subnet_cidrs[count.index]
  availability_zone = var.secondary_azs[count.index]
  
  tags = {
    Name        = "${var.project_name}-secondary-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}


resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-primary-nat-eip"
    Environment = var.environment
  }
  
  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "primary" {
  provider = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id = aws_subnet.primary_public[0].id
  
  tags = {
    Name        = "${var.project_name}-primary-nat"
    Environment = var.environment
  }
  
  depends_on = [aws_internet_gateway.primary]
}


resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-secondary-nat-eip"
    Environment = var.environment
  }
  
  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_nat_gateway" "secondary" {
  provider = aws.secondary
  allocation_id = aws_eip.secondary_nat.id
  subnet_id = aws_subnet.secondary_public[0].id
  
  tags = {
    Name        = "${var.project_name}-secondary-nat"
    Environment = var.environment
  }
  
  depends_on = [aws_internet_gateway.secondary]
}


resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = {
    Name        = "${var.project_name}-primary-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }
  
  tags = {
    Name        = "${var.project_name}-primary-private-rt"
    Environment = var.environment
  }
}


resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = {
    Name        = "${var.project_name}-secondary-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }
  
  tags = {
    Name        = "${var.project_name}-secondary-private-rt"
    Environment = var.environment
  }
}


resource "aws_route_table_association" "primary_public" {
  provider = aws.primary
  count = length(aws_subnet.primary_public)
  subnet_id = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider = aws.primary
  count = length(aws_subnet.primary_private)
  subnet_id = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "secondary_public" {
  provider = aws.secondary
  count = length(aws_subnet.secondary_public)
  subnet_id = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider = aws.secondary
  count = length(aws_subnet.secondary_private)
  subnet_id = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}