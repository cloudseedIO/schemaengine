var couchbase = require('couchbase');
var cluster = new couchbase.Cluster("couchbase://52.76.7.57");//52.77.86.146");//52.76.7.57");
var ViewQuery = couchbase.ViewQuery;
var records="records";
var schemas="schemas";
var cbContentBucket=cluster.openBucket(records);
var cbMasterBucket=cluster.openBucket(schemas);
var allCities={  "Providerab0ccde9-5f2c-258e-1133-603f99cd3e90":"Hyderabad",
	"Providerd675d8c7-e239-7524-8551-25126ef73f1f":"Hyderabad",
	"ServiceProvider56fa00c1-6ac2-d625-2ae5-f8f37fbe8e28":"Hyderabad",
	"Supplierddbba30e-ae63-5f0c-970a-09b39ff1b58a":"Bengaluru",
	"Supplier0ce03e0e-4570-b6d9-da0c-fc2914e8ffe0":"Hyderabad",
	"Supplier355af24f-54bb-7b01-5cfb-3cd5503504e1":"Hyderabad",
	"Supplier6d6fa446-073c-528a-e537-86c1bc388e62":"Hyderabad",
	"Supplierad1f707c-4a8b-225f-68ac-ae29f04d0fed":"Hyderabad",
	"Provider0750d2d5-43ee-1759-19db-6f7ae90b9925":"New Delhi",
	"Provider0ef611ae-9993-d2ae-14ad-65b9335a401f":"New Delhi",
	"Provider459cf9db-2c12-a80a-f35e-d2b3e1d9ab0b":"New Delhi",
	"Provider76d90a50-f0ca-5ad3-6a4b-627e2f32a865":"New Delhi",
	"Provider856d7351-65ee-f566-a2c1-2770068d7f2b":"New Delhi",
	"Provider99a6a0df-baf8-386c-7a7c-434e254e9a25":"New Delhi",
	"Providera481d420-cb38-90e4-3f1d-7f17bd730978":"New Delhi",
	"Provider0eb466ad-e40c-846e-44c4-235769b525f9":"New Delhi",
	"Provider257c9b7e-138f-568b-dd60-e50ed377c75a":"New Delhi",
	"Provider2d8ce623-01b3-c258-312e-d67eb778749b":"New Delhi",
	"Provider32bdd7ff-8d76-81d2-9f79-5e9f56232370":"New Delhi",
	"Provider445187e0-301b-3628-c403-c388c3a8ab4c":"New Delhi",
	"Provider49a1071b-4c15-4fc1-b2bb-d5ac2f69f00c":"New Delhi",
	"Providerb1e47471-90be-6094-ae2d-f95745ab5ec6":"New Delhi",
	"Providere30c6419-13f1-dd4b-a300-98f7c475d167":"New Delhi",
	"Providera5223d8e-1c05-d9aa-7c45-bc87d8fa371f":"New Delhi",
	"Providerc5f0baaa-8edf-8442-9ea9-b91977ef51a0":"Jaipur",
	"Provider15404cbf-ef6b-441a-43d2-5ab2af4c3cb4":"Ahmedabad",
	"Providerd8f626ef-0c0c-e704-39ec-2cdb72dd7958":"Ahmedabad",
	"Providera278aaf9-4c94-d6ec-c56a-836a47251295":"Ahmedabad",
	"Provider0afa1aa1-380d-dfd6-4798-68b0d34c6d6f":"Hyderabad",
	"Provider65966db2-8583-7305-31f1-42fd51c5057d":"Hyderabad",
	"Provider07e7adea-fc94-bcd6-884b-ed0adf8d33d8":"Bengaluru",
	"Provider1ec7ebb8-a1f9-a430-52e4-dc87ff85a4c9":"Bengaluru",
	"Provider32d8e3ec-5fef-bcb6-04b7-7bac0e3134bc":"Bengaluru",
	"Provider48545796-ea52-97d7-c434-8edb39824b60":"Bengaluru",
	"Provider518edf4f-837c-31a6-c49c-d84281c8d198":"Bengaluru",
	"Provider78626030-bbe9-19a6-1329-5698108b58e1":"Bengaluru",
	"Provider7f0a6736-8710-20f2-b255-0913b805b0c0":"Bengaluru",
	"Provider854f7ef3-832d-cd09-925b-5f78898bb8d7":"Bengaluru",
	"Provider940f4ca0-2211-cd21-8437-dd4a9983f62f":"Bengaluru",
	"Providera0ba9dc8-847f-7e61-a18a-b09d43735436":"Bengaluru",
	"Providerb6d498bd-6186-250c-e69a-bb9adc4cb963":"Bengaluru",
	"Providerbbcad04d-9bd4-76da-7e77-cc45250275a5":"Bengaluru",
	"Providerbcc76091-ed56-c2b7-e18e-f9779486378a":"Bengaluru",
	"Providerbce287a5-9752-30d3-a2d2-d85cb33db47b":"Bengaluru",
	"Providerc9f41859-f352-cb6e-bb8c-df6184ac20ba":"Bengaluru",
	"Providerdc1f9839-7c5c-f9fb-61a8-e7fcfa7f6b40":"Bengaluru",
	"Providerdfcd0e26-f72f-57f1-a11f-07ea583dcf4b":"Bengaluru",
	"Supplier0b298b74-9d37-e487-a20f-ef45ede87ccd":"Bengaluru",
	"Supplier2ea1883f-4035-f79d-ea4e-7e7374a1f245":"Bengaluru",
	"Supplier40c437d3-71f6-2977-1019-8354bc4853c9":"Bengaluru",
	"Supplier83b488e6-70e1-49dc-96cf-19cdc8d98a69":"Bengaluru",
	"Supplierb44a589f-d223-8860-4d57-c5f946dc37c9":"Bengaluru",
	"Suppliere08dffe9-b2b8-f03d-2360-4b5ed7a75097":"Bengaluru",
	"Providerf4fba7fa-0b39-401f-bcc0-72cc90a73a43":"Bengaluru ",
	"Supplier89c7c7c5-42e7-5621-52e6-ce1267f32528":"Bengaluru ",
	"Providera5f1ace2-3b50-0859-073f-e299f13e3d9e":"Bengaluru",
	"Providerafd2c1b6-cdb2-1be0-c8c5-7082d9534e81":"Bengaluru",
	"Providere5c667e5-f335-1513-5f6f-ac0c1bf0c73e":"Bengaluru",
	"Supplier058c1ccd-8192-3d2f-27e7-779c9b47645f":"Bengaluru",
	"Supplier862bdd83-9f16-9855-78fe-f837a619d4f0":"Bengaluru",
	"Supplierd45525b4-87e4-f928-6319-292669242fdc":"Bengaluru",
	"Supplierf513b6c5-fbd8-76e5-30e6-999476c69230":"Bengaluru",
	"Providerbcbbf2ad-f8f6-a33c-83d7-e8cb3b605bbb":"Bhubaneswar",
	"Provider75a0af33-1d6b-aba1-49fe-d8534b8056c3":"Patna",
	"Providerad702636-f409-b4ad-4f91-525bb3bf2bca":"Patna",
	"Providerc87896ba-4853-0295-8d2d-d19d4594478a":"Patna",
	"Providere583b188-f954-9c45-fc98-180bda2fcdf2":"Patna",
	"Providerf1f4306c-18d4-6968-586f-3761898e180d":"Patna",
	"Provider4eb21c69-d15f-fe99-0314-165d014cc292":"Chennai",
	"Provider4f766825-3700-4c57-b789-9736442df740":"Chennai",
	"Provider8c6ee77f-f1b2-38e4-aeca-ace1bd10d9d8":"Chennai",
	"Providerb4217cf5-01ff-b72d-8369-e80f0d291942":"Chennai",
	"Providerb5108ffe-aa07-44e6-051f-c77ec5978218":"Chennai",
	"Providerf0840deb-0b94-b6bb-72a5-09d965613aa5":"Chennai",
	"Supplier97552453-efd9-8e16-fb87-eb9f2bf4403d":"Hyderabad",
	"Provider09ee568f-4dbc-ed3f-bf5d-91a6fc2ae085":"New Delhi",
	"Provider488232d0-4038-083e-0156-c20fff7e931d":"New Delhi",
	"Provider27cb3fa7-a46d-36d2-e2dd-ca1dfd7fabd2":"New Delhi",
	"Provider7aee7130-295e-976e-d3ec-d4ee442e7085":"New Delhi",
	"Providerc4d1d479-d915-c7de-5354-c3323d286869":"New Delhi",
	"Providere1c6544c-2aa8-b163-f4c0-2c66d6f40a48":"New Delhi",
	"Provider32dddd85-1e35-bf9e-27df-65a86a72414c":"New Delhi",
	"Provider278db5b7-ade8-b25e-f7dc-b372998c7fce":"Other",
	"Provider07122574-d1ca-6b19-1475-e5bd6ad6ab28":"Ahmedabad",
	"Provider137ee2d3-2e06-a8fb-4a83-04c78c02b62c":"Ahmedabad",
	"Provider2ad8acb4-7921-41b1-c161-afc039b3ed44":"Ahmedabad",
	"Provider2c5e9557-2c43-dd24-8875-fea8b9ceacef":"Ahmedabad",
	"Provider3eb02af4-3e17-03b3-99ff-e69642d11b3e":"Ahmedabad",
	"Provider501694eb-5502-3bd4-c47b-1f4f4400409d":"Ahmedabad",
	"Provider5678fa11-19e4-41d7-e2f6-bb25c7e972b2":"Ahmedabad",
	"Provider58dad52f-8ca3-3ab0-7e51-7cf3452a566c":"Ahmedabad",
	"Provider5df30532-0155-d1f4-ef35-8088ac3f606e":"Ahmedabad",
	"Provider65683d6b-c1e0-9f25-b53c-739039bc5693":"Ahmedabad",
	"Provider6fc8d2da-546c-086a-b0c6-1b644d9a7bb5":"Ahmedabad",
	"Provider86d2c14b-10a5-558b-c73c-230cd75e7f20":"Ahmedabad",
	"Provider908ea4db-c521-1768-6da6-cca6981c449b":"Ahmedabad",
	"Providera2d7a0bf-f79d-b2b0-6dcb-fcac33a9a844":"Ahmedabad",
	"Providera56e5f57-eee5-5ea0-aa79-7006f57af53d":"Ahmedabad",
	"Providerad8a90ff-3750-cc44-6c6f-29e475cdb79c":"Ahmedabad",
	"Providerb0a13180-7598-24ee-129e-3e0d3cb5a4d8":"Ahmedabad",
	"Providerc5cd2eec-e7d3-5b92-8483-db7b154eb7e6":"Ahmedabad",
	"Providerdb06ab16-7e8d-b2ba-df10-6871c37dc444":"Ahmedabad",
	"Providerdde255f8-fd9b-7240-dd45-11140b78c243":"Ahmedabad",
	"Providere77e13fe-4ad4-2498-5de6-46e52e3b12db":"Ahmedabad",
	"Providere7f46506-4c64-46c3-cece-43fb10bf7ec6":"Ahmedabad",
	"Providerebb27316-95b6-3706-c906-35ed927ec043":"Ahmedabad",
	"Providerece43447-21ae-1b26-1798-bac8f86dc038":"Ahmedabad",
	"Providerf0c16823-9346-88ba-c470-2dbd8b41a883":"Ahmedabad",
	"Providerf151fadd-7b59-9b42-e44b-c4f07dee6672":"Ahmedabad",
	"Providerf1fe92d1-7e61-fc12-5e80-e059d63df9ee":"Ahmedabad",
	"Provider0b33b9d9-1af5-01d5-777f-9da3a7cfc4c8":"Gurgaon",
	"Provider12381ca7-719c-e84a-5dcf-fdfd6f59de4a":"Gurgaon",
	"Provider2096609a-442e-02bf-9e72-0a351469a003":"Gurgaon",
	"Provider45ebb4db-8252-a9a4-e182-bc2027d52f77":"Gurgaon",
	"Providercad99f85-d010-30b8-1f5e-421ad566a65c":"Gurgaon",
	"Provider1a736921-fc8b-f877-11d4-6b9b3d4bc998":"Gurgaon",
	"Provider80fcc3e1-d5e9-a9df-85fd-bd03c9017d71":"Gurgaon",
	"Providera5806055-a8ea-8f4b-832e-2441e556cf45":"Gurgaon",
	"Provider11cdc20e-51d0-7830-539f-647a01d82a27":"Gurgaon",
	"Provider5fd04039-48da-fb57-dd6c-f18d95807f74":"Gurgaon",
	"Provider6f2e4b90-4d97-d98c-5dc9-d8e63fcd137a":"Gurgaon",
	"Providera700ca4d-2907-c2aa-2c55-80148ccade08":"Gurgaon",
	"Provider4bf312ce-8e5e-9bee-c080-95c688090870":"Gurgaon",
	"Provider58a0ed66-12d6-d314-d1f9-955e92228862":"Gurgaon",
	"Providerdc349624-3b67-680d-db4c-27a9ef86e600":"Gurgaon",
	"Provider7e2ab707-b1b7-98fc-d52c-cafee7c9c636":"Shimla",
	"Supplier03a07d18-1879-7d42-db95-41d37f8e1a1a":"Hyberabad",
	"Provider318b1e44-c509-f188-909b-d40a38ea7362":"Hyderabad",
	"Providerc1eb8f7d-e114-44f1-3508-aeddd7edfaea":"Hyderabad",
	"ServiceProvider48eb6047-7003-1571-8d65-26f3f3733d8f":"Hyderabad",
	"ServiceProvider658b4b82-dd97-5cef-2cdb-38b0952e1e6d":"Hyderabad",
	"ServiceProvider8bd31d90-3fa2-31dc-d647-6693e6a56aa7":"Hyderabad",
	"ServiceProvider9d434643-5616-6fbf-4c1e-86dd7418725a":"Hyderabad",
	"ServiceProvideraebb312b-04f6-2376-8fe0-c2d5e97a3158":"Hyderabad",
	"ServiceProviderb9744eea-cf55-d577-0c3e-b6790c5c017c":"Hyderabad",
	"ServiceProviderbfc880b1-43ca-3212-0689-520a121f04e0":"Hyderabad",
	"Supplier001c6b4f-0312-5ecc-610c-32b0bd33104c":"Hyderabad",
	"Supplier03ae54ae-5499-ffa1-8c22-5bda3e53fe7d":"Hyderabad",
	"Supplier04705da3-6105-8660-90ef-544478175940":"Hyderabad",
	"Supplier047f850a-14bd-2b3d-aea2-3638ebb6853e":"Hyderabad",
	"Supplier08a0f948-f99d-b330-3dfc-c948593c10ae":"Hyderabad",
	"Supplier09445e04-0d86-67f8-3700-c2565056e6f3":"Hyderabad",
	"Supplier0c5112d5-884a-cbb6-93c0-39f1cb8891eb":"Hyderabad",
	"Supplier0c6d8062-0b65-79fa-0f5e-3014bc63c3f9":"Hyderabad",
	"Supplier0d671d8a-1cc9-0a7b-aa00-b520003b16b6":"Hyderabad",
	"Supplier0e884161-f143-ea0d-8253-53928e294356":"Hyderabad",
	"Supplier11d0ef9a-2f7e-871f-9d86-9d4cb2f821c9":"Hyderabad",
	"Supplier1702534a-8606-86c2-ae13-965d37f2db26":"Hyderabad",
	"Supplier17e3ef9f-525b-d055-363b-ef38a0281f10":"Hyderabad",
	"Supplier1a737a28-7eeb-292f-6baa-6cec8810a5e5":"Hyderabad",
	"Supplier1a7ebf71-56bc-7924-c61f-f107b39bf28b":"Hyderabad",
	"Supplier1b082e9a-cf59-f73a-3621-54bc96b93434":"Hyderabad",
	"Supplier1cec3a13-179f-e72f-9998-9e6d68f6ad64":"Hyderabad",
	"Supplier1d492351-0eb8-a419-28b1-fbdfe4f8f897":"Hyderabad",
	"Supplier1d4bf85b-23b4-2b88-1382-1c8e12d14441":"Hyderabad",
	"Supplier1dfe04d0-c598-25d9-a02a-0f1a0144db9a":"Hyderabad",
	"Supplier1e9747fa-b0b1-304d-0f5b-9a7d856541ad":"Hyderabad",
	"Supplier20420e18-c2a7-af50-bd16-8fe8ad07a617":"Hyderabad",
	"Supplier235c8235-9571-f6f1-aea9-bab4fb7770f9":"Hyderabad",
	"Supplier27b3ab01-626e-97b7-0020-98381823a1dc":"Hyderabad",
	"Supplier27c96532-9a07-d9bc-8835-86defe573eec":"Hyderabad",
	"Supplier2a077f22-8dd7-b2b8-829d-d6536f5960ae":"Hyderabad",
	"Supplier2a799d62-fec4-c387-ed1c-543c5d8495a6":"Hyderabad",
	"Supplier2ad14e7a-4364-1b1b-562b-db8247a8db3d":"Hyderabad",
	"Supplier2ba9e97d-0ec8-1e5e-5877-437694c43bae":"Hyderabad",
	"Supplier2dbc7227-9c9c-7f0a-3c72-d38954aa15d6":"Hyderabad",
	"Supplier30814738-3214-77cc-4523-80728227362f":"Hyderabad",
	"Supplier3089fa98-88da-24f5-bfd0-9bcf276298de":"Hyderabad",
	"Supplier30fdeee2-116c-d5a7-fd2b-008178424e27":"Hyderabad",
	"Supplier31244500-c99b-b8ee-a2b7-146a98e429c7":"Hyderabad",
	"Supplier33d03fec-8655-a2f8-9431-1b984c8b509d":"Hyderabad",
	"Supplier348fa304-89a5-379c-c23a-c040a870811f":"Hyderabad",
	"Supplier35fb804c-036e-a060-914d-9dc235601893":"Hyderabad",
	"Supplier36babf46-eb3f-db8b-ff31-d73596f7a2c2":"Hyderabad",
	"Supplier37418bd9-aece-290a-c186-d27e794e5c81":"Hyderabad",
	"Supplier37a36b07-4c9d-4ac3-d9c2-05f7a3b354c4":"Hyderabad",
	"Supplier3819bdcf-d5db-f1ea-7aaa-f0bef0a6375d":"Hyderabad",
	"Supplier3956517d-5055-1dd8-dbe3-8295726166e1":"Hyderabad",
	"Supplier3a443f83-4e71-2028-fde8-59e13ddb1ef5":"Hyderabad",
	"Supplier3a62732c-7ce8-366f-d847-59ed5e31576c":"Hyderabad",
	"Supplier3ab9aa6d-e3ec-6877-d8c9-98b0dc6afdc4":"Hyderabad",
	"Supplier3ba481a4-fddb-cff7-57b3-ed3378f3451a":"Hyderabad",
	"Supplier3c2df0e3-5803-b6a0-2cc0-01c028e6de51":"Hyderabad",
	"Supplier3fc3a210-2dca-8f99-8826-3bdb53fc4592":"Hyderabad",
	"Supplier40cd348e-cffe-da61-949d-79802169ebaa":"Hyderabad",
	"Supplier43d8e518-37e2-56af-0f15-e8ac999e51ea":"Hyderabad",
	"Supplier4412e353-0338-e114-cb00-8b755024d50b":"Hyderabad",
	"Supplier47941655-a938-8637-5a57-829698122c95":"Hyderabad",
	"Supplier47f72481-bcd3-66ad-e3b0-95031126ce16":"Hyderabad",
	"Supplier48ec7ee5-1ecf-67ba-dda7-3bb4a0aafccf":"Hyderabad",
	"Supplier4a7b7d9c-1c87-942c-8efd-0578ed41b96a":"Hyderabad",
	"Supplier4a99dfa0-9a32-72d8-b503-addb76e274ef":"Hyderabad",
	"Supplier4bacf09e-2c74-01cb-a582-c25a1a633c40":"Hyderabad",
	"Supplier4e0a43d4-c96d-6b5a-c96a-591adf0c8728":"Hyderabad",
	"Supplier4e17cbde-596d-680d-773c-d80ef5d4c90e":"Hyderabad",
	"Supplier4e37631d-5052-a58d-97a4-4cf38868c8c1":"Hyderabad",
	"Supplier4fe340b2-443a-af06-c1d0-1ac97a751c9f":"Hyderabad",
	"Supplier522c3dd4-8a20-deab-bd58-811a764b7c52":"Hyderabad",
	"Supplier528ebc3f-d95d-27ee-5441-811588c922de":"Hyderabad",
	"Supplier5387d82f-d5c4-036b-2264-19ea798c0bee":"Hyderabad",
	"Supplier53caa9ad-8dcb-cc0f-faa1-03a2ea2fccf8":"Hyderabad",
	"Supplier5709deaa-d622-9a8d-1835-642a1a76ce7e":"Hyderabad",
	"Supplier570f1ca3-f827-3ab9-8e2c-ea7879f0e0e6":"Hyderabad",
	"Supplier575408c2-083c-865c-627b-f7037d84b1bb":"Hyderabad",
	"Supplier57a16068-8cfc-df85-69fc-56f25991abba":"Hyderabad",
	"Supplier57b16a63-8852-ce10-6c2d-679cb3a4b38a":"Hyderabad",
	"Supplier59c77546-3664-6eb1-8117-979e07203ed3":"Hyderabad",
	"Supplier59f391e8-18da-be12-72a6-e0d71392ad1f":"Hyderabad",
	"Supplier5a87fa1d-e29e-6729-6474-f2a3ce4c8a02":"Hyderabad",
	"Supplier5cd51366-232f-a432-bc82-89a989b4bedd":"Hyderabad",
	"Supplier5d0ccf6d-7768-961f-94a7-c0e4242a9cfb":"Hyderabad",
	"Supplier5d299460-2920-c8c1-ba85-c1b25a1715d3":"Hyderabad",
	"Supplier5d9cc088-3435-95ba-c9fd-c597473f123d":"Hyderabad",
	"Supplier62188f70-4784-88d6-af90-6ed1c8bdaf4e":"Hyderabad",
	"Supplier62920dfe-b11e-7567-8883-a72f7c8c37da":"Hyderabad",
	"Supplier62bd0d49-b913-ceb7-53f4-95aaa74c8860":"Hyderabad",
	"Supplier635c92b2-cdab-7ace-fc17-80919836fe19":"Hyderabad",
	"Supplier669d1946-2c80-c416-861e-7a7dd65ac4d5":"Hyderabad",
	"Supplier68d17330-d04a-6ac5-181f-be061f7b198c":"Hyderabad",
	"Supplier694935de-aeb2-ab65-605f-d632b99984e7":"Hyderabad",
	"Supplier6d51ddfc-1d84-e404-8764-15a7328c5a7c":"Hyderabad",
	"Supplier6e6d9a55-dacf-3cab-c745-41e5f95299c4":"Hyderabad",
	"Supplier6e705926-437c-9489-a266-95c2db380204":"Hyderabad",
	"Supplier70b88160-767e-b04e-9f7c-ab772fa509a0":"Hyderabad",
	"Supplier7273aac8-550e-7a7c-48d5-e8da096b54b9":"Hyderabad",
	"Supplier72f3df77-73f4-b234-1730-ce8a8c466fe6":"Hyderabad",
	"Supplier730c260e-f891-86fb-5bc6-5fed3c4c8e5b":"Hyderabad",
	"Supplier73ae10f0-8971-e4b4-9911-03e83c28a334":"Hyderabad",
	"Supplier754026f4-599e-3218-e15b-46a608cfdc93":"Hyderabad",
	"Supplier768baf35-018e-2af6-e15d-332d983ad97c":"Hyderabad",
	"Supplier7737e284-12ef-9592-24d1-2f255135f5f3":"Hyderabad",
	"Supplier779c6917-7d28-baf1-b6e5-761ef032e7b4":"Hyderabad",
	"Supplier78f40ea6-cb9c-d88c-7074-aa6d32ec54c2":"Hyderabad",
	"Supplier79197432-02b8-1d50-1473-2bbfefe70050":"Hyderabad",
	"Supplier798d1812-9ba2-48a4-23bd-264691770d80":"Hyderabad",
	"Supplier7a28bae1-fd4e-741b-faa9-42f5215c6813":"Hyderabad",
	"Supplier7a8964f2-bd68-3281-1c2b-de856eff7780":"Hyderabad",
	"Supplier7ad72303-472c-6e52-fd7c-cfd0a653bcb1":"Hyderabad",
	"Supplier7b15cc10-cc06-3b1a-2810-2c4a8858efca":"Hyderabad",
	"Supplier7d31988c-279e-7e1b-26a6-2b3a5275e91e":"Hyderabad",
	"Supplier7e1b2743-5a67-ce90-4769-8453be54be99":"Hyderabad",
	"Supplier7e447ac5-b9e0-23e9-c5e9-97bebfb66620":"Hyderabad",
	"Supplier7e80bcf0-bbac-8dea-b114-3710e2d204f4":"Hyderabad",
	"Supplier7ebf0a0a-e36f-c114-ef86-905877ad0e3d":"Hyderabad",
	"Supplier7fa850d8-0f17-9c8b-ef5b-42b7a597b84a":"Hyderabad",
	"Supplier803a3abc-2a17-7f0e-b0ce-5320c61272d7":"Hyderabad",
	"Supplier808f479b-1e91-8233-bdc2-54142e847812":"Hyderabad",
	"Supplier82c5abd3-1f66-85db-ba39-988f25172189":"Hyderabad",
	"Supplier83bcdade-4cb8-a91c-e27b-4525ded656ed":"Hyderabad",
	"Supplier840bfb48-5112-9372-9e39-3230c0979ed3":"Hyderabad",
	"Supplier8532a1a7-50ff-14f3-ce5e-8f32150f0a63":"Hyderabad",
	"Supplier86c20c80-e945-8bb4-9c63-c7b729e3a508":"Hyderabad",
	"Supplier8932c8a8-56e9-a12f-19a9-3b687e0b9af2":"Hyderabad",
	"Supplier89ba4654-caa8-b520-f336-7d1572f83adf":"Hyderabad",
	"Supplier8aa63feb-ff84-170a-5848-43a25afbada6":"Hyderabad",
	"Supplier8b26e317-0f3c-27fd-ef39-0d77cbca04c5":"Hyderabad",
	"Supplier8ef7b187-5602-b2e5-1359-b92939fc05fc":"Hyderabad",
	"Supplier8f8846a8-15fe-37d3-d6ce-8e3a6acd1b45":"Hyderabad",
	"Supplier8fc88e34-0407-a504-8dec-ac2ed74f3fde":"Hyderabad",
	"Supplier901c8215-12fa-34a8-5a68-4a9777aa5002":"Hyderabad",
	"Supplier913a8538-dca7-c146-35b9-4fdb312f2981":"Hyderabad",
	"Supplier977e7858-5e03-a8e5-db4b-c32f60f4df45":"Hyderabad",
	"Supplier97ba79c3-9c75-9c15-2932-a5122d5a98a9":"Hyderabad",
	"Supplier9acdd419-5866-155d-f060-afa511e9389d":"Hyderabad",
	"Supplier9b0bbfb4-4f4b-a20d-e1b2-ccf6fa24e7fb":"Hyderabad",
	"Supplier9b744de8-c311-3599-e74e-e9db0c6678ba":"Hyderabad",
	"Supplier9b919861-a4d0-d818-a777-52207f6ccc59":"Hyderabad",
	"Supplier9c88df13-c018-cae9-9922-be6c70f7a39c":"Hyderabad",
	"Supplier9cbe6ba9-ff18-f53a-b46f-f411a88beb11":"Hyderabad",
	"Supplier9d2a9154-e827-23e5-19ef-20106defbf87":"Hyderabad",
	"Supplier9da5160a-830f-1c96-34bd-ceec8d1c7c51":"Hyderabad",
	"Supplier9ffb20d4-4675-af5b-7f87-1dbd5aa1d8b5":"Hyderabad",
	"Suppliera095bc09-b085-5807-4c5c-9870e14ae1d3":"Hyderabad",
	"Suppliera3138ea4-379b-5f5c-a77a-c7489c712a18":"Hyderabad",
	"Suppliera518bb78-70af-723e-b33c-ee6083620100":"Hyderabad",
	"Suppliera5cad20b-768a-b507-74f9-3680ea9b5e1c":"Hyderabad",
	"Suppliera7aef7b8-a376-5926-c745-56710020b0ed":"Hyderabad",
	"Suppliera7e03e1c-ac64-257e-a320-61cf85d235da":"Hyderabad",
	"Suppliera896eb92-4e5a-5211-74f1-888e8342771e":"Hyderabad",
	"Suppliera8c76f9f-6362-b73b-093a-5ef5f7ea02eb":"Hyderabad",
	"Supplierad265fb0-f5c3-9631-9911-16126a65227a":"Hyderabad",
	"Supplieradfbf73d-d2f1-4782-d8ef-94d804bd11e7":"Hyderabad",
	"Supplierb07ca5d5-ae0d-7899-59d4-58baf42684c4":"Hyderabad",
	"Supplierb083b8c4-538c-03d5-9d44-2feeeb507c69":"Hyderabad",
	"Supplierb2a694c6-20b4-ac8c-5c2e-b7b763da5f91":"Hyderabad",
	"Supplierb41851ee-ee97-78e1-fa54-86a4b004469d":"Hyderabad",
	"Supplierb4f24d17-e3c1-c5ca-02e8-bdba83feaa5d":"Hyderabad",
	"Supplierb658c087-7dce-9410-1ec6-3301bc3f0d9d":"Hyderabad",
	"Supplierb8c34744-86b8-441d-23ae-d77b4b625b8b":"Hyderabad",
	"Supplierb8c798b7-6713-d4d3-b22a-bb22550924f9":"Hyderabad",
	"Supplierb9634ce8-341e-d271-66af-369858d7d7b9":"Hyderabad",
	"Supplierbc587289-3032-06a7-2d72-41a9f3c134ca":"Hyderabad",
	"Supplierbefbad15-a3a3-1465-43ac-6995b5012e05":"Hyderabad",
	"Supplierbf86674d-4c1f-2afa-1b9a-3446bbe9e27e":"Hyderabad",
	"Supplierc00bb90e-f1b7-2d3d-0a07-b1851a7f2b7c":"Hyderabad",
	"Supplierc0e71df7-6bc5-aeea-e7c2-e0153bdf04b5":"Hyderabad",
	"Supplierc348abfd-e0ee-9356-e102-c596757e70cc":"Hyderabad",
	"Supplierc4a45c57-bbae-488c-557d-ad5c929a8909":"Hyderabad",
	"Supplierc4ca238f-971f-0a51-deb2-525ab1a04880":"Hyderabad",
	"Supplierc6a5bbab-ab30-3a16-1ead-2686dfbf6880":"Hyderabad",
	"Supplierc6b887f7-a1c3-0c7c-5bb1-68eff63cd5fe":"Hyderabad",
	"Supplierc6dca781-8f6e-327d-c7cb-4da7130679c3":"Hyderabad",
	"Supplierc7b4d659-a22d-9f18-c101-7b3ee5633319":"Hyderabad",
	"Supplierc8caa580-007d-9bd4-c95a-12ff999188ab":"Hyderabad",
	"Suppliercb0040dd-d9d3-c107-9568-66a0f76f0edd":"Hyderabad",
	"Suppliercb1b14a9-4dda-d1f6-cf08-fd519f15e9fe":"Hyderabad",
	"Suppliercd91efc4-03f1-df59-789f-d11a162bd7ab":"Hyderabad",
	"Supplierd028d8e6-79fa-2be8-be9d-17adb4987106":"Hyderabad",
	"Supplierd0f3bb4c-7816-f58a-e2d1-9ff1b0fcb783":"Hyderabad",
	"Supplierd210fdff-e943-3e94-d00e-8d0649108933":"Hyderabad",
	"Supplierd349ba9b-e37f-8436-2452-637fc830e0b6":"Hyderabad",
	"Supplierd542a6a8-f2ab-df04-d0ed-a62dc1872b4e":"Hyderabad",
	"Supplierd6bac358-ff2e-cec3-255d-7adb22d564a7":"Hyderabad",
	"Supplierd6ec69a7-cdef-8638-a5f0-bb2f9176c5f5":"Hyderabad",
	"Supplierd77a12c0-5c50-2b56-0898-bf3f316702c7":"Hyderabad",
	"Supplierd87f9523-dcb8-a0c9-9eac-64f6d65f22d3":"Hyderabad",
	"Supplierd899cb49-b39a-107f-5f1c-4913de67facf":"Hyderabad",
	"Supplierda3eed56-7ffb-cf18-f771-6457fc2a17bb":"Hyderabad",
	"Supplierde805eb3-5bae-6c73-3296-d806d8d01cc7":"Hyderabad",
	"Supplierdfeae530-44ad-62bf-eb06-0e8d38191547":"Hyderabad",
	"Suppliere17344f6-7839-29de-57b0-1af024d71e53":"Hyderabad",
	"Suppliere25ae6c3-af09-5e97-402e-b7296aad69e4":"Hyderabad",
	"Suppliere711542f-14be-6158-ea71-16b573088af1":"Hyderabad",
	"Suppliere7dc13f0-080a-21e6-f386-91c80e3108d2":"Hyderabad",
	"Suppliere8de52f1-8baf-176c-64bc-42a8c872bfbd":"Hyderabad",
	"Suppliereaac50d4-8077-604c-3e42-7d86d48127d7":"Hyderabad",
	"Supplierec8af6cd-a7b7-26ac-1c70-05eb16f8ece2":"Hyderabad",
	"Suppliered68f2d3-82dc-c2db-0383-798e6b7f1367":"Hyderabad",
	"Supplieredecd6b4-d95d-15cf-bbcc-dba52726b847":"Hyderabad",
	"Supplieree5de394-84cc-24a7-1c09-32ede5f07307":"Hyderabad",
	"Supplierf2644477-5bd2-c472-b4f5-4a7a76de47c2":"Hyderabad",
	"Supplierf288f697-ad37-4354-6281-77925d953df6":"Hyderabad",
	"Supplierf2c6f7bf-3d99-5fdd-a223-777682b9350f":"Hyderabad",
	"Supplierf31922a5-7c0d-fd0a-4773-a1fb12818548":"Hyderabad",
	"Supplierf34534ac-82e7-6091-b638-7d7ad76f220c":"Hyderabad",
	"Supplierf49f0b05-5542-1e78-4d5b-b1da39bb2d12":"Hyderabad",
	"Supplierf75b6ca3-93bf-e5cb-9ecd-e97b1ef052bc":"Hyderabad",
	"Supplierf92dfc3c-407d-46f8-c47a-cbe0253a4588":"Hyderabad",
	"Supplierfc340a80-b1d1-6b31-6aeb-e8501c3df23d":"Hyderabad",
	"Supplierfc4254fd-8dc1-9386-7ac0-3b002c29e6d6":"Hyderabad",
	"Supplierffc24ec7-c723-5610-3b7a-d12f008944c2":"Hyderabad",
	"Supplier51e71c1c-ed90-1738-d8e2-76c757f20174":"Hyderabad",
	"Supplier18a7cb76-fb82-9446-8131-c0bbf2042baa":"Hyderabad",
	"Supplier205a6b5b-1c46-8081-0df0-4ef708656d00":"Hyderabad",
	"Supplier237bb09a-f869-205b-0eb5-ac8e1d0a6d5b":"Hyderabad",
	"Supplier259e2efb-f880-9dd7-e7fb-edad1f65355a":"Hyderabad",
	"Supplier32247025-c80c-bc72-e6d7-7df2dbdce11d":"Hyderabad",
	"Supplier3e2afd68-20fb-6e79-07f8-2e924ca1b592":"Hyderabad",
	"Supplier4ef3599a-14fb-3c2d-1913-2a9acf1d57b1":"Hyderabad",
	"Supplier51a6e2c2-2997-5798-03af-1ce18a132ed2":"Hyderabad",
	"Supplier66632787-d013-1fe1-3d5e-24a511829981":"Hyderabad",
	"Supplier6c9bcef3-9dcb-42f4-ad09-472f0b72f017":"Hyderabad",
	"Supplier7107ea70-0d0c-a128-7817-da4a8b260467":"Hyderabad",
	"Supplier78eee490-e798-5ffd-1241-74a52b88aaae":"Hyderabad",
	"Supplier897ec33f-41f5-1922-2e6e-5515d0110ffd":"Hyderabad",
	"Supplier913b506a-501e-661d-805c-dc5a9052b1a8":"Hyderabad",
	"Supplierb2ea02cc-c11e-0a49-3327-53a9a2339986":"Hyderabad",
	"Supplierb7cb4799-d902-8496-e8dc-7f5ac03c26f9":"Hyderabad",
	"Supplierbe5ff404-8799-c920-9c82-ad28aacd14bf":"Hyderabad",
	"Supplierca07e864-5224-75b4-7144-35567175a9ab":"Hyderabad",
	"Suppliercbcff452-228a-2831-8255-c722a2a2e36b":"Hyderabad",
	"Suppliercf55cc95-3d2b-02fd-d38b-b73ad2a97164":"Hyderabad",
	"Supplierd0e0614a-0bee-784e-0500-16b023fb0b6c":"Hyderabad",
	"Suppliere5ce1eb9-4ae5-8613-ab86-5aee73d961d5":"Hyderabad",
	"Supplieree532cc9-a93c-9dd9-a642-f73e5b4b94ce":"Hyderabad",
	"Supplieref2e8b6a-87bd-912e-ac90-5918ac792387":"Hyderabad",
	"Supplierefb16022-5029-78d0-ca38-f2d5456d6b0d":"Hyderabad",
	"Supplierfdccc3ba-2f85-cbf3-7c3f-eeabc7c9ceab":"Hyderabad",
	"Supplier0ca42f55-0533-6844-6ac9-b3c33cad3eb9":"Hyderabad",
	"Supplier019bece1-b580-4084-42f4-0ec5454e9a29":"Hyedrabad",
	"Providere2b885fc-ad0c-24d7-2ca0-e838b3b136ee":"Indore",
	"Provider16ca994d-b836-3943-d45f-e12ad0c04021":"Kanpur",
	"Providerd54b2c49-4baf-0337-6c1c-083e5be548ff":"Bengaluru",
	"Provider00cb5e78-e1aa-5208-f0e3-92b3990b36aa":"Bengaluru",
	"Provider04403f81-72dc-dcc7-85f3-d82ebac75128":"Bengaluru",
	"Provider0504b43e-8eac-f5e8-e0a7-94f5ea6f6dfe":"Bengaluru",
	"Provider088da192-8ee0-a2fb-d7e7-aa8eec9e1187":"Bengaluru",
	"Provider131cc5c2-12b6-bd1b-64ba-d1ed6e09baae":"Bengaluru",
	"Provider16de2d93-957d-cf60-c466-919470065e0e":"Bengaluru",
	"Provider196c503c-c6db-4216-1149-214c48a489be":"Bengaluru",
	"Provider1c9f1d34-a5ec-12dd-58f9-604788730e21":"Bengaluru",
	"Provider1ffdac4b-4487-c48c-54bd-9b4c6164c63f":"Bengaluru",
	"Provider20ef872c-679e-1b3d-3366-95a6bb163b0d":"Bengaluru",
	"Provider29e93669-9fdc-3ca6-f2eb-13ea1c559e9c":"Bengaluru",
	"Provider2b964b8f-882b-fee7-9fdd-90ea08e8b876":"Bengaluru",
	"Provider30abddec-490e-a7a4-5ff0-fee219befe54":"Bengaluru",
	"Provider38fd72db-eead-2b9e-ea0c-bc0d03bbbca0":"Bengaluru",
	"Provider41f51860-d940-7535-3a40-71faa54ffc99":"Bengaluru",
	"Provider46a18e8c-cdef-8932-86e7-f52f05b39b1c":"Bengaluru",
	"Provider49435a6e-2cfc-8887-eeff-f828cc8fd50e":"Bengaluru",
	"Provider75035d96-df47-d140-4df7-4fc022e21b01":"Bengaluru",
	"Provider7d3c72cb-4993-526e-ea43-84581bad2451":"Bengaluru",
	"Provider9a06ee5b-98d9-bc35-1402-5346a595c217":"Bengaluru",
	"Provider9e2292df-bdd8-d35f-cd09-77597aea1574":"Bengaluru",
	"Providera087aa9d-df3e-61b6-05ae-ae6dc369fd22":"Bengaluru",
	"Provideraa415f9c-eef1-3f90-a0aa-d2de1b904203":"Bengaluru",
	"Providerc04d88a5-3861-f3de-1d6f-bc8bb0fc520f":"Bengaluru",
	"Providerd06d5255-2207-424d-7c06-d6e5758aae13":"Bengaluru",
	"Providere2f2de76-228b-60ba-c64f-b81badc8e9e5":"Bengaluru",
	"Providerf13f6241-2c2c-6322-fac1-f56315ec79bc":"Bengaluru",
	"Provider48a19374-4650-8d38-9e90-b34d55b6cd46":"Thiruvananthapuram",
	"Provider69e28b89-87ff-4ff5-7eb0-a59fc72cca78":"Thiruvananthapuram",
	"Providera4009bf2-5b1a-6c13-bb3a-6ca78d44691c":"Thiruvananthapuram",
	"Providere00733ff-4f34-4ea6-451e-fc877f05379f":"Thiruvananthapuram",
	"Provider0c67b85e-46c6-e371-2b47-78c37055b24d":"Thiruvananthapuram",
	"Provider1a1d613d-ce95-3de7-66f4-a79d98c86f5a":"Thiruvananthapuram",
	"Providerc1fd3a0a-10ca-6104-8fd1-54d7b33d6b1d":"Thiruvananthapuram",
	"Providerde4fab45-adde-9716-17d2-327a0ec3794d":"Thiruvananthapuram",
	"Provider82ce7a7a-97db-693e-6bb2-857fa694fd3b":"Indore",
	"Provider92271f12-7e82-a5e4-aabe-b37e07981670":"Indore",
	"Provider14b2be6a-2869-aef5-aa4b-1003d2eaddce":"Indore",
	"Provider21dc9513-f1cf-8497-dc48-3587df548b79":"Indore",
	"Provider2355e801-148b-90d9-73e5-e4736a62078c":"Indore",
	"Provider03b4682c-7bc7-7f4c-bb01-b9b56c501216":"Mumbai",
	"Provider1bbc1a6e-8667-8dfa-e1f1-c1bb1ccf132e":"Mumbai",
	"Provider2092d6cc-f4eb-5b4b-1ac5-9bf53dfa2894":"Mumbai",
	"Provider215b9080-9025-b6b7-3055-b996f7c4f468":"Mumbai",
	"Provider302d41e9-00b7-a658-c270-13a62af8ae81":"Mumbai",
	"Provider31490dfa-1341-af6a-4e87-f753d41dc671":"Mumbai",
	"Provider4422027c-19fe-d855-adf6-ef19d2e3e3e0":"Mumbai",
	"Provider4571e873-9ef2-02a7-dc58-74bdca74a8fd":"Mumbai",
	"Provider616d72b2-56f3-4eae-695f-5e3cae0f50ea":"Mumbai",
	"Provider6cae53aa-96e1-de9e-3358-435d99619e73":"Mumbai",
	"Provider728f6a13-773f-0246-42af-9b4f2dc45f3c":"Mumbai",
	"Provider95de4a92-e0e2-da62-27ad-ba1c9bfaafe0":"Mumbai",
	"Provider9cf59b2e-5cb0-3488-d18b-0df41a175b0a":"Mumbai",
	"Providera57c0388-e1f7-a31a-6f56-87d32d4b1d98":"Mumbai",
	"Providerbb4248bc-1b9d-9b68-7499-cefa0581539f":"Mumbai",
	"Providerc7a24cdb-eb82-d895-5d86-3864f5695566":"Mumbai",
	"Providerd0302c17-1c2b-8203-86be-e8d1da14bc0c":"Mumbai",
	"ServiceProvider86b5a128-a5db-6f39-3c83-627ecb9cc8ee":"Mumbai",
	"Provider035f71be-d491-1b98-a5cb-c6d1c16a4e3e":"Mumbai",
	"Provider1c5fc8c8-09ff-51aa-ce8a-7c16a1bea163":"Mumbai",
	"Provider1dd21a7c-6151-def9-0a3d-a96d06270efe":"Mumbai",
	"Provider1ea71834-5b81-b329-9094-eea076158d26":"Mumbai",
	"Provider2b8cfac4-05d6-da2a-aad5-0ff5d6e0edee":"Mumbai",
	"Provider323f8377-a3e5-4365-61c7-264ded617a77":"Mumbai",
	"Provider4fee7c46-a011-8f7e-482d-78d0dd3b5296":"Mumbai",
	"Provider5337c47a-b028-8bc8-df8d-f94ec00aad50":"Mumbai",
	"Provider6b4c7d9a-5130-e631-e708-8a29a5a683ed":"Mumbai",
	"Provider7fc07286-fcb9-4cff-1519-fbed13a34759":"Mumbai",
	"Provider834e7746-8236-b20f-fbd0-aeed0c2583d0":"Mumbai",
	"Provider881ee72b-3bec-8701-58ea-55b00a167107":"Mumbai",
	"Provider9543a950-8ffd-9156-38b2-c0eefbf90ae4":"Mumbai",
	"Provider97866a69-d778-d80c-bb3f-a93bf687f3c6":"Mumbai",
	"Provider9eca3380-0942-67cf-f816-ab7c95a2417e":"Mumbai",
	"Providerae633e3a-c8e6-47f2-4d41-0bb9b4bfe74b":"Mumbai",
	"Providerb7d96db5-d45a-f8da-c417-d058cbc2d2ad":"Mumbai",
	"Providerbbb96ca2-3f52-5726-aae2-43ed28976e6a":"Mumbai",
	"Providerce067096-9d22-ef95-db40-f769416fbbc3":"Mumbai",
	"Providere96cf041-6217-0b92-d3cf-8dc81c3c16e4":"Mumbai",
	"Provider24c5ddea-bf1e-ff08-5b7f-b616b5c61efc":"Mumbai",
	"Provider24cd20a1-c622-dcda-4fbc-159d85b49e2f":"Mumbai",
	"Provider24e5830c-3582-15b9-78d7-8e51190543f0":"Mumbai",
	"Provider27770b30-b376-d23b-8874-b26a85ad77ae":"Mumbai",
	"Provider2c556d6a-88e7-9f69-bb53-59d39a104d89":"Mumbai",
	"Provider2ea7482d-9804-bd57-976d-b5a3e1fea674":"Mumbai",
	"Provider412f7ed5-1454-e6e2-c960-3f7f216f17cb":"Mumbai",
	"Provider495d4154-f11f-5a63-a4cc-8b2f1eaa7164":"Mumbai",
	"Provider544c960b-d1f5-eef9-ecea-614ff6c6eda5":"Mumbai",
	"Provider7f42bc8c-2918-d2c7-1806-62a5bafae4f4":"Mumbai",
	"Provider8f0337df-baeb-d780-5716-da0d6bd2131f":"Mumbai",
	"Provider91b14b61-e82f-9686-9f25-4404e90f78b0":"Mumbai",
	"Providera41ba83b-a5f1-a00a-2a1f-0d043e864d2c":"Mumbai",
	"Providerced61a18-0d07-f11b-6027-925398e42075":"Mumbai",
	"Providerd16764db-3664-9b17-fb63-5ad8fd056189":"Mumbai",
	"Providere1331342-24a2-3f43-38a0-358a0d9ab08a":"Mumbai",
	"Providered287ddd-95eb-42f6-69c8-a96de6b3ea07":"Mumbai",
	"Supplier073f7c34-9bc8-3c49-476e-3d8bac2d9edf":"Mumbai",
	"Supplierd184667d-1ef9-c5de-1d3b-9c9e33c8e21e":"Mumbai",
	"Provider3768ae58-991d-4cbb-995a-b465698e3402":"Mumbai ",
	"Providera247c8c0-63af-b218-7b9f-71b85d8a18d6":"Mumbai ",
	"Providercd7f3f21-7198-163d-27c4-ce5296a016a7":"Mumbai ",
	"Provider80c64a08-e562-e300-8850-3b0d2766e956":"Mumbai",
	"Provider13d05670-5047-51f8-a9fd-3db2db8ea769":"New Delhi",
	"Provider1df9b425-7b61-3070-dd7e-a42b13a8b749":"New Delhi",
	"Provider4ed551d6-ccdf-4545-d200-0739564bb806":"New Delhi",
	"Provider542ea6d2-53de-46d6-e5e7-7b0733237417":"New Delhi",
	"Provider6308d3d2-227b-ad8b-a0c0-db3e47200cef":"New Delhi",
	"Provider6e1b38b6-4c3c-7cdd-ebdc-a98efc943d9d":"New Delhi",
	"Provider726d4a56-2f51-96a4-ad6d-001d5a6d929b":"New Delhi",
	"Provider8c308a70-4647-8848-f302-907edbb159d1":"New Delhi",
	"Provider8d610ab4-3b32-2097-6e8d-686774177cd2":"New Delhi",
	"Provider90326501-8eb3-f4b5-67e5-49095dcb7831":"New Delhi",
	"Provider9262d664-d164-d910-be58-83376a15dd8d":"New Delhi",
	"Provider9580c6fc-91ae-a3d7-af30-e46e278fd531":"New Delhi",
	"Provider95a0db70-032b-a595-40c9-072dae64fe24":"New Delhi",
	"Provider9d871587-58b6-da4c-de7d-37d9f9e219ba":"New Delhi",
	"Providera21b7903-1510-c74b-5afd-a6ee2c3942f4":"New Delhi",
	"Providera860ff33-3749-0c5d-e59e-9ad37045b2b9":"New Delhi",
	"Providerb294d28c-7d3f-b78b-c29f-410a8092616b":"New Delhi",
	"Providerb7f83ea4-d556-b18b-c889-b033cb1e29ef":"New Delhi",
	"Providerbda3e969-483a-b58a-fad3-444eed7e60df":"New Delhi",
	"Providerc488df2f-2043-764f-578d-50e15e24b723":"New Delhi",
	"Providerfc7b48a0-5250-7874-fb25-2310a909cac5":"New Delhi",
	"Provider1a5de674-697e-f208-b9d3-cbe054b01608":"New Delhi",
	"Provider2b0ab67a-3d03-5298-0567-3a9735f4c103":"New Delhi",
	"Provider0a0840ce-d698-35ce-efcf-25b254cb2667":"New Delhi",
	"Provider17e18c08-c448-b00d-a43d-b42a212bf615":"New Delhi",
	"Provider28d5b026-84d4-6dcd-ea48-185a253f6461":"New Delhi",
	"Provider35c6aeee-0948-8a5e-3a08-e575daa01215":"New Delhi",
	"Provider4ccc1a68-a8f4-1ecf-8596-0bc248899a30":"New Delhi",
	"Provider722beccd-796e-690c-af9c-f82a3f2776a6":"New Delhi",
	"Provider84747c24-7938-dfce-f667-293fb3354689":"New Delhi",
	"Provider9ece7e8f-a736-a55c-9931-0c0397af2db1":"New Delhi",
	"Providerdc25c514-a83f-d3f5-9251-950f424a38b1":"New Delhi",
	"Providere451913b-eda8-db68-571b-a2add2937c8f":"New Delhi",
	"Providerf1d637ae-62f6-94b3-e93d-bffda2e8fca3":"New Delhi",
	"Provider844f3f27-9359-d8f9-7bc3-00f44efa8ad7":"New Delhi",
	"Provider80e76c91-b6a9-2e09-ffa1-35be56115082":"New York",
	"Providerf8ee74da-5264-4dc1-85d4-d5f8f7428b75":"Noida",
	"Providerdd573418-7dfa-24df-3165-ab983bfd738c":"Pune",
	"Provider667e8ce0-e472-7bbd-180f-927d26549865":"Ludhiana",
	"Provider031ceede-74bd-430a-1df9-24a15fb5883c":"Jaipur",
	"Provider5138334d-d293-bf5e-e41d-1ed61db6685a":"Jaipur",
	"Provider5e98399a-f632-8554-85d3-5758bca12b35":"Jaipur",
	"Provider83c9c0fd-3ef7-cd3a-1c3e-4f1a20f12351":"Jaipur",
	"Providerb26029ce-7b97-7062-381c-e2f305d917ae":"Jaipur",
	"Providerc3b8a51c-cfe0-bfac-9d18-450bd7f208fa":"Jaipur",
	"Providercf8da3de-9be8-925a-9da2-33e537d08e2c":"Jaipur",
	"Providerea0baa5a-0f0f-c150-f484-5de68019fa93":"Jaipur",
	"Providerd51da0d9-addf-dc12-ab91-9ad90e714528":"Jaipur ",
	"Provider834889a3-0c63-b4db-ff41-f2675c0c4080":"Secunderabad",
	"Supplier1b85868a-8ea2-46c6-530b-207c2430c568":"Secunderabad",
	"Supplier5264e2fb-9fd6-1041-6652-c9ac05f25a84":"Secunderabad",
	"Supplier609379b0-b5be-a879-f23d-4249ac0e22e6":"Secunderabad",
	"Supplier67c00ccc-63e5-bb45-beb6-149ac00a7abc":"Secunderabad",
	"Supplier822db920-8f1d-3889-e091-c7a99c9ed169":"Secunderabad",
	"Supplier90db5878-8edf-4004-365e-15f93346cff0":"Secunderabad",
	"Supplier92eeb1ba-e8be-50f7-b48d-f00643b25f94":"Secunderabad",
	"SupplierStanjo":"Secunderabad",
	"Suppliera7fe1b55-fd41-1fd2-11a7-f97f94bd65de":"Secunderabad",
	"Supplieraff6dee5-de9c-df43-5eee-7553c427c36d":"Secunderabad",
	"Supplierc0d05ba1-b234-1fe5-67da-7ab6424e7697":"Secunderabad",
	"Supplierd3dca4ab-6d7c-5ea0-8d0d-dba3a62057b1":"Secunderabad",
	"Suppliere0863f18-0384-1371-d3fc-9c45fb6582a8":"Secunderabad",
	"Suppliere202a569-a526-ca8f-7254-5a912478e394":"Secunderabad",
	"Supplierddc0e64b-1521-f8b0-731d-94f958d10eb1":"Secunderabad",
	"Supplier4a29c412-e87c-94d8-c7e7-eff167d0d98d":"Secunderabad ",
	"Provider84d6b885-cbb1-1ed1-9bd8-0f4af8ace61c":"Surat",
	"Supplier4454d446-c4d7-7017-a3bc-38e4b8be30e3":"Hyderabad",
	"Provider2b24856b-a1d8-bf84-8f3e-b554098046e3":"Chennai",
	"Provider3f82a950-b3b2-20c0-fbde-3fd4bdb67e64":"Chennai",
	"Provider494b3c20-b03f-e76b-f876-b2ac9ebe3d11":"Chennai",
	"Provider54ed0daa-e9a9-07fb-ea20-b359cc2febe4":"Chennai",
	"Provider79e1a45c-4295-aa15-e4fc-b3d5f89d6176":"Chennai",
	"Provider7d9e2908-0b69-d543-884e-42f0dcbfbd38":"Chennai",
	"Provider85ae2fc9-542c-0316-6155-6ea853eb3593":"Chennai",
	"Provider9b2650e1-b13d-d49e-80c8-3c53ee405b62":"Chennai",
	"Provideree5982b9-233a-8ad9-57a9-7359494011a6":"Chennai",
	"Provider02d4fe86-1c60-afc6-36ad-cb7c95b99816":"Hyderabad",
	"Provider0d824538-c8c9-4fda-4f44-3903e78d2856":"Hyderabad",
	"Provider1425c36b-cf01-8f57-4776-5242a687368c":"Hyderabad",
	"Provider18078411-a0b0-8159-ccf3-79738adf87bc":"Hyderabad",
	"Provider2015412f-540a-bbf3-884c-bfa7a0e08412":"Hyderabad",
	"Provider32063de7-0e46-1d67-b2d6-d45237fdcddb":"Hyderabad",
	"Provider34cd1db0-8405-8585-7fd4-f420181bc5f4":"Hyderabad",
	"Provider37c8f7cf-e3fa-e72e-105f-65ee2b54b4a6":"Hyderabad",
	"Provider38446c45-20fb-f7bd-0c76-5b28198f4191":"Hyderabad",
	"Provider3b8140e3-7810-fcf6-ded0-ca9fa63aeb31":"Hyderabad",
	"Provider4aecdbc3-3c06-e31c-dd39-84bbd7b1a99f":"Hyderabad",
	"Provider4e0c01c8-4eb1-4f34-c248-8519ddad9861":"Hyderabad",
	"Provider55deee8e-4fdf-6ba4-bc87-c555b42dcdc2":"Hyderabad",
	"Provider57f0e77d-12fc-a459-5e7c-f221b459b243":"Hyderabad",
	"Provider6c66b3b9-52a5-0aeb-3f0d-9de4e8c3816b":"Hyderabad",
	"Provider7c66c931-a68c-1381-9e21-53b85a61f18f":"Hyderabad",
	"Provider8c4bdd23-3046-a13d-5784-243aebdbc7f3":"Hyderabad",
	"Provider90f9b3a0-ed12-fb76-751f-88e69a086b60":"Hyderabad",
	"Provider9b726715-22ed-0a06-43f8-0b8e0757c5ab":"Hyderabad",
	"Provider9f0364c8-dc1d-fead-8901-4b6d5f42f481":"Hyderabad",
	"Providerb3b3ad07-95f2-4a0f-a21b-7a4d4b6c768b":"Hyderabad",
	"Providerbb5cb6a8-cacc-6ea6-3981-e822308e3a1e":"Hyderabad",
	"Providerbfa70378-77a5-4878-2454-ac6dd1af9854":"Hyderabad",
	"Providerc3e89a5e-dd81-a7b7-3e8a-bbd278b056c2":"Hyderabad",
	"Providerdffb56bc-b25b-7c2f-d373-5ddbd7f46fdc":"Hyderabad",
	"Providered4eac41-2eff-833c-261e-9b7ca706737c":"Hyderabad",
	"Provideree1f19c5-3b65-1423-7a07-8b2e565d71f3":"Hyderabad",
	"Providerf68edd27-e4ae-d52c-205c-bf27eadfd26f":"Hyderabad",
	"Providerf6ad0ed1-f243-e62b-1dc1-22acccfe7689":"Hyderabad",
	"Providerfc93df1d-5163-5726-2079-14d3904bc17d":"Hyderabad",
	"ServiceProvider026939d6-0c4a-c278-22d8-73f0ac821398":"Hyderabad",
	"ServiceProvider051bd999-4336-0b57-9b95-d6a953010195":"Hyderabad",
	"ServiceProvider14ff05d3-c71a-93df-931e-449603620b59":"Hyderabad",
	"ServiceProvider1c28cfc6-47b8-a0a5-865b-d2d5029dccc0":"Hyderabad",
	"ServiceProvider27149e4a-5f14-e80f-2e72-92fc6b9689c0":"Hyderabad",
	"ServiceProvider3565a187-1364-e79b-debf-8f54ce15a58a":"Hyderabad",
	"ServiceProvider35bba0fe-051c-0c4c-4b21-756d8d3681b0":"Hyderabad",
	"ServiceProvider3cfc671e-415f-84a1-bfd6-5a1441052eb5":"Hyderabad",
	"ServiceProvider4a257d85-46c7-0305-f3ce-f030d19f9454":"Hyderabad",
	"ServiceProvider530c0e14-b4e4-c48b-2b1c-cb45f54e4f68":"Hyderabad",
	"ServiceProvider5a6210d8-bd8c-7a3f-3a9f-a969be3ed8f5":"Hyderabad",
	"ServiceProvider5a82b42f-4148-4010-833a-488c5808e70b":"Hyderabad",
	"ServiceProvider62ca4d80-1c69-6c17-05a5-1faaf726fe79":"Hyderabad",
	"ServiceProvider65585a72-9065-a8d8-4ed3-f1f94200bf6a":"Hyderabad",
	"ServiceProvider6d55133c-33a5-66fb-12d5-dc98798b7fbe":"Hyderabad",
	"ServiceProvider7342375e-29f5-bc33-63fe-ae206f4c1e46":"Hyderabad",
	"ServiceProvider76ec18a9-8fbc-07a5-1c29-7a09e696671e":"Hyderabad",
	"ServiceProvider7809bd74-b3b7-8d47-b681-8c3afe47447f":"Hyderabad",
	"ServiceProvider78a8f010-1e7d-36ca-c200-d0001d19331c":"Hyderabad",
	"ServiceProvider8a74efb2-62bc-4336-217e-109cc8786183":"Hyderabad",
	"ServiceProvider92dc2a4f-2afd-03ec-0926-643954a01c4f":"Hyderabad",
	"ServiceProvider92e2a791-feeb-ce0f-6078-58e63592eb8e":"Hyderabad",
	"ServiceProvider9a3592a6-c75d-cf36-fe93-d7eae36b39bf":"Hyderabad",
	"ServiceProvidera0848cd8-6d19-f875-1bce-56bbc9e97b6c":"Hyderabad",
	"ServiceProviderae6cd0a8-4856-8d38-7ac2-8bbbc37fd375":"Hyderabad",
	"ServiceProviderb6510fae-4eba-9940-a0f0-635524c2e418":"Hyderabad",
	"ServiceProviderc016ff24-456d-0412-8973-fbc083ee8601":"Hyderabad",
	"ServiceProviderc2e1d154-4791-d141-c880-b08cf034f624":"Hyderabad",
	"ServiceProviderd3c2344b-48b6-3a4a-1c8e-051eb8a364a6":"Hyderabad",
	"ServiceProviderdb510f62-448b-0489-3fbd-974f07f49c7e":"Hyderabad",
	"ServiceProvidere7dc6606-455a-d710-a25a-473a81fe9019":"Hyderabad",
	"ServiceProviderf682586e-8a75-d3b0-a26c-6fb2c82b0441":"Hyderabad",
	"ServiceProviderff7ba157-5472-cd61-d75e-efd98d6238ea":"Hyderabad",
	"Supplier39cd9ff0-c674-8548-6f1a-2e1d3d5f1b98":"Hyderabad",
	"Supplier42c8d85f-b47a-e298-a919-f7226e2391dd":"Hyderabad",
	"Supplier6001f86b-f1d2-2206-67e5-7aa95722927c":"Hyderabad",
	"Suppliera9d1778b-4733-1a3d-0249-3e93cbafe897":"Hyderabad",
	"Supplierf0707bf4-f0bc-17e8-aa37-09f2c3240734":"Hyderabad",
	"Provider76181147-ff3e-989f-84ff-a841f3c5b4d7":"Mumbai",
	"Providered2fc042-20cc-f601-77b1-752b06855a42":"Mumbai",
	"Providere9c6c683-a71d-2c65-5374-f80828ba90b4":"Thrissur",
	"Supplier8ba74934-5fde-1f92-7f9e-c852b837b787":"Hyderabad",
	"ServiceProvider5a5cc2a4-d494-b63d-f585-b1c7f5a682dc":"Hyderabad",
	"ServiceProvider8b3310ac-b18b-eeff-5c3e-25d4f69fe06a":"Hyderabad",
	"ServiceProvider8b77b6b1-499c-5baf-d345-4d33df8ebccb":"Hyderabad",
	"Providerf50c9885-0bc0-c663-fb71-a798b72ec090":"Lucknow",
	"Provider0eab4993-d333-c627-08dc-2d0ca598c3b4":"Visakhapatnam ",
	"Providerba7ab2a4-c26c-e942-8ec7-939a2137a186":"Kolkatta",
	"Providerbdbec71f-6e79-00ce-de3c-3e7854348bf1":"Kolkatta",
	"Providerf07a3313-69bc-1f76-2fe1-8079732ab99e":"Kolkatta",
	"Providerf93b6467-299d-8795-e544-6b37f6943c81":"Kolkatta"
}








var query = ViewQuery.from("Test", "test")//.skip(0).limit(1).stale(ViewQuery.Update.BEFORE);
cbContentBucket.query(query, function(err, data) {
		if(err){
			console.log(err);
			return;
		}
	console.log(data.length);
	if(data.length==0){
		return;
	}
	updateProduct(0);

	function updateProduct(index){
		var docu=data[index].value;
		docu.cityName=allCities[docu.recordId]?allCities[docu.recordId]:"Hyderabad";
		console.log("Updating ........."+ (index*1+1) +"          "+docu.recordId+"             ");	
		cbContentBucket.upsert(docu.recordId,docu,function(err, result) {
			if (err) { console.log(err); }
			if((index+1)<data.length){
				updateProduct(index+1);
			}
		});
	}
});


