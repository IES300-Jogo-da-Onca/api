-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: jdonca_db
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `nomeExibicao` varchar(255) NOT NULL,
  `loginUsuario` varchar(255) NOT NULL,
  `senhaUsuario` varchar(255) NOT NULL,
  `ehPremium` tinyint(1) NOT NULL DEFAULT '0',
  `ehSuperUser` tinyint(1) DEFAULT '0',
  `moedas` int NOT NULL DEFAULT '0',
  `idSkinOncaEquipada` int DEFAULT NULL,
  `idSkinCachorroEquipada` int DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `loginUsuario` (`loginUsuario`),
  UNIQUE KEY `loginUsuario_2` (`loginUsuario`),
  KEY `usuarioSkinCachorro_idx` (`idSkinCachorroEquipada`),
  KEY `usuarioSkinOnca_idx` (`idSkinOncaEquipada`),
  CONSTRAINT `usuarioSkinCachorro` FOREIGN KEY (`idSkinCachorroEquipada`) REFERENCES `skin` (`id`),
  CONSTRAINT `usuarioSkinOnca` FOREIGN KEY (`idSkinOncaEquipada`) REFERENCES `skin` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'teste','teste','46070d4bf934fb0d4b06d9e2c46e346944e322444900a435d7d9a95e6d7435f5',0,0,0,NULL,NULL),(2,'testecompra','testecompra','',0,0,0,NULL,NULL),(3,'Usuario qualquer ','usuarioqualquer','55a5e9e78207b4df8699d60886fa070079463547b095d1a05bc719bb4e6cd251',0,0,0,NULL,NULL),(4,'Izaura Gonçalves','izahonorato','b7e94be513e96e8c45cd23d162275e5a12ebde9100a425c4ebcdd7fa4dcd897c',0,0,0,NULL,NULL),(6,'Nome teste','Userteste','2cacac5a5544237d00ca6629617c21386b065a7773f04ced8bab24be24edea97',0,0,0,NULL,NULL),(8,'Nome teste qualquer','Usuarioqualquerteste','b7e94be513e96e8c45cd23d162275e5a12ebde9100a425c4ebcdd7fa4dcd897c',0,0,0,NULL,NULL),(11,'Nome','nomeuser','b7e94be513e96e8c45cd23d162275e5a12ebde9100a425c4ebcdd7fa4dcd897c',0,0,0,NULL,NULL),(13,'Willian','Will','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',0,0,0,NULL,NULL),(22,'FGuerriero','FGuerriero','e9224ba376efc36e24f27fcfb5afebe46b0ba33e9edb42177a4f7d5393de6285',0,1,0,1,4),(23,'TesteFer','TesteFet','e9224ba376efc36e24f27fcfb5afebe46b0ba33e9edb42177a4f7d5393de6285',0,0,0,NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-01-19  9:36:39
