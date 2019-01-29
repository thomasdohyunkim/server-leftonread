import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireSignin } from './services/passport';

import * as DateText from './controllers/date_text_controller';
import * as ShareUrl from './controllers/share_url_controller';
import * as UploadController from './controllers/upload_controller';
import * as InstanceController from './controllers/instance_controller';
import * as MetricController from './controllers/metric_controller';
import * as UserController from './controllers/user_controller';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, `${__dirname}/uploads/`);
  },
  filename(req, file, cb) {
    if (file.fieldname === 'vcf') {
      cb(null, `${file.fieldname}-${Date.now()}.vcf`);
      return;
    }
    InstanceController.generateUniqueKey()
      .then((key) => {
        console.log(`Saving file upload under key: ${key}`);
        cb(null, `${key}.db`);
      })
      .catch((error) => {
        console.log(error);
      });
  },
});

const upload = multer({ storage })
  .fields([{ name: 'chatdb', maxCount: 1 }, { name: 'vcf', maxCount: 1 }]);

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Left on Read\'s API' });
});

router.route('/instance')
  .get(InstanceController.getInstance)
  .post(InstanceController.validateInstance);

router.route('/upload')
  .post(upload, UploadController.uploadFile);

router.route('/link')
  .post(requireAuth, UploadController.linkInstance);

router.route('/metric')
  .post(MetricController.getMetrics);

router.route('/allnumbers')
  .post((req, res) => { return DateText.getAllNumbers(req, res); });

router.route('/wordfilter')
  .post((req, res) => { return DateText.wordFilter(req, res); });

router.route('/shareUrl')
  .post((req, res) => { return ShareUrl.saveGraph(req, res); })
  .get((req, res) => { return ShareUrl.getGraph(req, res); });

router.route('/signin')
  .post(requireSignin, UserController.signIn);

router.route('/signup')
  .post(UserController.signUp);

export default router;
