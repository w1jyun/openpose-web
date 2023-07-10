import { getImage } from '../../utils/image'
import {
    CopyTextToClipboard,
    uploadImage,
    uploadJson,
} from '../../utils/transfer'
import { DetectPosefromImage } from '../../utils/detect'

import { BodyControlor } from '../../body'

import { GetLoading } from '../../components/Loading'
import { BodyEditor } from '../../editor'
import i18n from '../../i18n'
import { Oops } from '../../components/Oops'
import assets from '../../assets'
import { ShowToast } from '../../components/Toast'
import { GetRandomPose, LoadPosesLibrary } from '../../pose-library'

export class Helper {
    editor: BodyEditor
    constructor(editor: BodyEditor) {
        this.editor = editor
    }
    async detect(dataUrl: [], i: number) {
        const image = document.createElement('img')
        console.log(`images/${i}.png`)
        image.src = dataUrl[i]

        const result = await DetectPosefromImage(image)

        if (result) {
            if (!result.poseWorldLandmarks)
                return
                // throw new Error(JSON.stringify(result))

            const positions: [number, number, number][] =
                result.poseWorldLandmarks.map(({ x, y, z }) => [
                    x * 100,
                    -y * 100,
                    -z * 100,
                ])

            // this.drawPoseData(
            //     result.poseWorldLandmarks.map(({ x, y, z }) =>
            //         new THREE.Vector3().fromArray([x * 100, -y * 100, -z * 100])
            //     )
            // )

            await this.editor.SetBlazePose(positions)
            this.editor.SaveImage(`${i}`)
            if (i==310) return
            setTimeout(() => this.detect(dataUrl, i+1), 1000)
        }
    }

    async DetectFromImage(onChangeBackground: (url: string) => void) {
        console.log('DetectFromImage')

        const body = await this.editor.GetBodyToSetPose()
        console.log('body')
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        const loading = GetLoading(500)
        console.log('GetLoading')
        try {
            const dataUrl = await uploadImage()
            console.log('dataUrl', dataUrl)
            if (!dataUrl) return
            console.log('loading')
            loading.show({ title: i18n.t('Downloading MediaPipe Pose Model') })
            loading.hide()
            this.detect(dataUrl as [], 0)
            // setTimeout(()=>{}, 10000);
            // const image = await getImage(dataUrl)
            // onChangeBackground(dataUrl)
        } catch (error) {
            loading.hide()

            Oops(
                i18n.t(
                    'If you try to detect anime characters, you may get an error. Please try again with photos.'
                ) +
                    '\n' +
                    error
            )
            console.error(error)
            return null
        }
    }

    async CopyKeypointToClipboard() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }
        try {
            const data = new BodyControlor(body).Get18keyPointsData()
            await CopyTextToClipboard(JSON.stringify(data, null, 4))
            ShowToast({ title: i18n.t('Copied to Clipboard') })
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async SaveGesture() {
        const hand = await this.editor.getSelectedHand()
        if (!hand) {
            ShowToast({ title: i18n.t('Please select a hand!!') })
            return
        }
        try {
            this.editor.SaveGesture()
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async LoadGesture() {
        const hand = await this.editor.getSelectedHand()

        if (!hand) {
            ShowToast({ title: i18n.t('Please select a hand!!') })
            return
        }

        const rawData = await uploadJson()
        if (!rawData) return

        try {
            this.editor.RestoreGesture(rawData)
        } catch (error) {
            Oops(error)
            console.error(error)
            return null
        }
    }

    async GenerateSceneURL() {
        try {
            const d = encodeURIComponent(
                JSON.stringify(this.editor.GetSceneData())
            )
            const url_base = location.href.replace(/#$/, '')
            const url = `${url_base}#${d}`
            await CopyTextToClipboard(url)
            ShowToast({ title: i18n.t('Copied to Clipboard') })
        } catch (error) {
            Oops(error)
            console.error(error)
        }
    }

    async SetRandomPose() {
        const body = await this.editor.GetBodyToSetPose()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        const loading = GetLoading(500)

        try {
            let poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }

            loading.show({ title: i18n.t('Downloading Poses Library') })

            await LoadPosesLibrary(assets['src/poses/data.bin'])
            loading.hide()

            poseData = GetRandomPose()
            if (poseData) {
                await this.editor.SetPose(poseData)
                return
            }
        } catch (error) {
            loading.hide()

            Oops(error)
            console.error(error)
            return
        }
    }
    async CopySkeleton() {
        const body = this.editor.getSelectedBody()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        this.editor.CopySelectedBody()
    }
    async RemoveSkeleton() {
        const body = this.editor.getSelectedBody()
        if (!body) {
            ShowToast({ title: i18n.t('Please select a skeleton!!') })
            return
        }

        this.editor.RemoveBody()
    }
    FeedbackByQQ() {
        window.open('https://jq.qq.com/?_wv=1027&k=N6j4nigd')
    }
    FeedbackByGithub() {
        window.open(
            'https://github.com/nonnonstop/sd-webui-3d-open-pose-editor/issues/new/choose'
        )
    }
}
